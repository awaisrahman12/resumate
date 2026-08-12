import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    // Optional: Google users never set a password.
    passwordHash: {
      type: String,
      default: null,
    },
    // How this account was created. Drives which sign-in methods are allowed.
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    // Google's stable account id (the `sub` claim).
    //
    // NO `default: null` here on purpose. A sparse unique index only skips
    // documents where the field is ABSENT — an explicit null still counts as a
    // value, so defaulting to null would make every email signup collide with
    // the previous one on googleId. Email accounts simply omit the field.
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    // Email users must confirm an OTP before they can sign in. Google emails
    // arrive pre-verified, so those accounts start out true.
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // --- OTP state (never store the raw code) ---
    otpHash: { type: String, default: null, select: false },
    otpExpiresAt: { type: Date, default: null, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpLastSentAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

/** Strip secrets whenever a user is serialized to JSON. */
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.otpHash;
    delete ret.otpExpiresAt;
    delete ret.otpAttempts;
    delete ret.otpLastSentAt;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
