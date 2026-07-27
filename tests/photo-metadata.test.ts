import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCameraName,
  formatExposureCompensation,
  formatExposureTime,
  formatFileSize,
  formatLensDescription,
  formatMegapixels,
} from "../lib/photos/photo-metadata";
import type { PhotoMetadata } from "../lib/photos/photo-metadata";

const iphoneMetadata: PhotoMetadata = {
  make: "Apple",
  model: "iPhone 16 Pro",
  lensModel: "iPhone 16 Pro back triple camera 6.765mm f/1.78",
  width: 2048,
  height: 2731,
  fileSize: 978_903,
  mimeType: "image/jpeg",
  fNumber: 1.78,
  focalLength: 6.765,
  focalLength35mm: 24,
  iso: 80,
  exposureTime: 0.0001099989,
  exposureCompensation: 0,
};

test("formats the native-style camera and lens labels", () => {
  assert.equal(formatCameraName(iphoneMetadata), "Apple iPhone 16 Pro");
  assert.equal(
    formatLensDescription(iphoneMetadata),
    "Back triple camera — 24 mm ƒ1.8"
  );
});

test("formats file size and megapixels compactly", () => {
  assert.equal(formatFileSize(iphoneMetadata.fileSize), "978.9 KB");
  assert.equal(formatMegapixels(iphoneMetadata), "5.6 MP");
});

test("formats sub-second shutter speeds as fractions", () => {
  assert.equal(formatExposureTime(iphoneMetadata.exposureTime!), "1/9091 s");
  assert.equal(formatExposureTime(1.5), "1.5 s");
});

test("normalizes zero and positive exposure compensation", () => {
  assert.equal(formatExposureCompensation(0.01), "0 ev");
  assert.equal(formatExposureCompensation(0.7), "+0.7 ev");
});
