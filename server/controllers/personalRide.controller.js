const mongoose = require("mongoose");
const PersonalRide = require("../models/PersonalRide");
const User = require("../models/User");
const AdminWallet = require("../models/AdminWallet");
const SOSAlert = require("../models/SOSAlert");

const COMMISSION_RATE = 0.04; // 4%

const RADIUS_METERS = 3 * 1000;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.create = async (req, res) => {
  try {
    const { pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress, fullPrice: fullPriceBody, offeredPrice, vehicleType } = req.body;
    if (pickupLat == null || pickupLng == null || dropLat == null || dropLng == null || offeredPrice == null) {
      return res.status(400).json({ message: "Pickup, drop coordinates and offeredPrice are required" });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    // Reject admin token (admin id is string "admin", not a valid ObjectId). Drivers are still allowed to book as riders.
    if (String(userId) === "admin") {
      return res.status(403).json({
        message: "Please log in with a rider account to book a ride. Admin cannot book from this page.",
        code: "USE_RIDER_ACCOUNT",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(403).json({
        message: "Invalid session. Please log in again as a rider.",
        code: "INVALID_SESSION",
      });
    }
    const offered = Number(offeredPrice);
    const fullPrice = fullPriceBody != null ? Number(fullPriceBody) : offered;
    const ride = await PersonalRide.create({
      user: userId,
      pickupLat: Number(pickupLat),
      pickupLng: Number(pickupLng),
      pickupAddress: pickupAddress || "",
      dropLat: Number(dropLat),
      dropLng: Number(dropLng),
      dropAddress: dropAddress || "",
      fullPrice,
      offeredPrice: offered,
      vehicleType: vehicleType || "Auto",
      pickupLocation: {
        type: "Point",
        coordinates: [Number(pickupLng), Number(pickupLat)],
      },
    });
    res.status(201).json(ride);
  } catch (error) {
    console.error("PersonalRide create error:", error);
    const message = error.name === "ValidationError" ? error.message : "Server Error";
    res.status(500).json({ message: error.response?.data?.message || message });
  }
};

// Ride vehicle types: Auto, Cab, Sedan, Go Sedan. Driver types: Auto, Car, Sedan, Go Sedan.
// Cab and Car are treated as same category for matching.
function getAllowedRideTypesForDriver(driverVehicleType) {
  if (!driverVehicleType) return [];
  if (driverVehicleType === "Car" || driverVehicleType === "Cab") return ["Car", "Cab"];
  return [driverVehicleType];
}

exports.nearby = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select("vehicleType isDriver driverApproved");
    if (!driver || !driver.isDriver || !driver.driverApproved) {
      return res.status(403).json({ message: "Driver approval required" });
    }
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "lat and lng query params required" });
    }
    const allowedVehicleTypes = getAllowedRideTypesForDriver(driver.vehicleType);
    if (allowedVehicleTypes.length === 0) {
      return res.json([]);
    }
    const rides = await PersonalRide.find({
      status: "pending",
      vehicleType: { $in: allowedVehicleTypes },
      pickupLocation: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: RADIUS_METERS,
        },
      },
    })
      .populate("user", "name email phone")
      .lean();
    const withDriverPrice = rides.map((r) => {
      const full = r.fullPrice != null ? r.fullPrice : r.offeredPrice;
      return { ...r, driverPrice: Math.round(full * (1 - COMMISSION_RATE)) };
    });
    res.json(withDriverPrice);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const ride = await PersonalRide.findById(req.params.rideId)
      .populate("user", "name email phone gender")
      .populate("driver", "name phone")
      .lean();
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const isDriver = ride.driver && String(ride.driver._id) === String(req.user.id);
    const fullPrice = ride.fullPrice != null ? ride.fullPrice : ride.offeredPrice;
    if (isDriver) {
      const driverPrice = Math.round(fullPrice * (1 - COMMISSION_RATE));
      res.json({ ...ride, driverPrice, fullPriceForDriver: fullPrice });
    } else {
      res.json(ride);
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.accept = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id);
    if (!driver || !driver.isDriver || !driver.driverApproved) {
      return res.status(403).json({ message: "Driver approval required" });
    }
    const ride = await PersonalRide.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.status !== "pending") {
      return res.status(400).json({ message: "Ride is no longer available" });
    }
    const otp = generateOTP();
    ride.driver = req.user.id;
    ride.status = "accepted";
    ride.otp = otp;
    await ride.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${ride.user}`).emit("ride:accepted", {
        rideId: ride._id,
        driverName: driver.name,
        driverPhone: driver.phone,
        otp,
        message: "A driver has accepted your ride. Share this OTP with the driver when they arrive: " + otp,
      });
    }

    const updated = await PersonalRide.findById(ride._id)
      .populate("user", "name email phone")
      .populate("driver", "name phone")
      .lean();
    res.json({ ride: updated, otp });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.startRide = async (req, res) => {
  try {
    const { otp } = req.body;
    const ride = await PersonalRide.findById(req.params.rideId)
      .populate("user", "name email phone gender")
      .populate("driver", "name phone");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driver?._id?.toString() !== req.user.id && ride.driver?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your ride" });
    }
    if (ride.status !== "accepted") {
      return res.status(400).json({ message: "Ride cannot be started" });
    }
    if (ride.otp !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP. Ride not started." });
    }
    ride.status = "ride_started";
    await ride.save();

    const fullPrice = ride.fullPrice != null ? ride.fullPrice : ride.offeredPrice;
    const commission = Math.round(fullPrice * COMMISSION_RATE);
    const concessionDeduction = fullPrice > ride.offeredPrice ? fullPrice - ride.offeredPrice : 0;
    const wallet = await AdminWallet.getOrCreate();
    wallet.totalCommission = (wallet.totalCommission || 0) + commission;
    wallet.totalConcessionDeduction = (wallet.totalConcessionDeduction || 0) + concessionDeduction;
    await wallet.save();

    const ridePayload = await PersonalRide.findById(ride._id)
      .populate("user", "name email phone gender")
      .populate("driver", "name phone")
      .lean();
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${ride.user._id || ride.user}`).emit("ride:started", {
        rideId: ride._id,
        message: "Your ride has started.",
        ride: ridePayload,
      });
    }

    const updated = await PersonalRide.findById(ride._id)
      .populate("user", "name email phone")
      .populate("driver", "name phone")
      .lean();
    const driverPrice = Math.round(fullPrice * (1 - COMMISSION_RATE));
    res.json({ ...updated, driverPrice, fullPriceForDriver: fullPrice });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.myRides = async (req, res) => {
  try {
    const rides = await PersonalRide.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("driver", "name phone")
      .lean();
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.reportSOS = async (req, res) => {
  try {
    const ride = await PersonalRide.findById(req.params.rideId)
      .populate("user", "name email phone gender")
      .populate("driver", "name phone");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const userId = ride.user?._id?.toString() || ride.user?.toString();
    if (userId !== req.user.id) return res.status(403).json({ message: "Only the rider can report SOS" });
    if (ride.status !== "ride_started" && ride.status !== "accepted") {
      return res.status(400).json({ message: "SOS can only be reported for an active ride" });
    }
    const alert = await SOSAlert.create({
      ride: ride._id,
      user: ride.user._id || ride.user,
      driver: ride.driver._id || ride.driver,
      userSnapshot: {
        name: ride.user?.name,
        email: ride.user?.email,
        phone: ride.user?.phone,
        gender: ride.user?.gender,
      },
      driverSnapshot: {
        name: ride.driver?.name,
        phone: ride.driver?.phone,
      },
      rideSnapshot: {
        pickupAddress: ride.pickupAddress,
        dropAddress: ride.dropAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropLat: ride.dropLat,
        dropLng: ride.dropLng,
        offeredPrice: ride.offeredPrice,
        vehicleType: ride.vehicleType,
      },
    });
    const io = req.app.get("io");
    if (io) {
      io.to("admin").emit("sos:alert", {
        alertId: alert._id,
        rideId: ride._id,
        user: alert.userSnapshot,
        driver: alert.driverSnapshot,
        ride: alert.rideSnapshot,
        createdAt: alert.createdAt,
      });
    }
    res.status(201).json({ message: "SOS sent to admin. Help is on the way.", alertId: alert._id });
  } catch (error) {
    console.error("SOS report error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
