# iOS Shortcut: "Add to website"

This iOS Shortcut lets you upload photos directly from your iPhone to your website.

## Prerequisites

1. Set the `PHOTOS_UPLOAD_API_KEY` environment variable in your Vercel project
2. Generate a secure random key: `openssl rand -base64 32`
3. Add it to your Vercel environment variables

## Creating the Shortcut

Open the **Shortcuts** app on your iPhone and create a new shortcut:

### 1. Set Up Input
- Tap **Add Action**
- Search for **Receive** and select "Receive [Images] input from [Share Sheet]"

### 2. Loop Through Photos
- Add action: **Repeat with Each**
- Set it to repeat with "Shortcut Input"

### 3. Get Photo Date (inside repeat block)
- Add action: **Get Details of Images**
- Get: **Date Taken**
- From: **Repeat Item**
- Save to variable: `PhotoDate`

### 4. Resize Image (inside repeat block)
- Add action: **Resize Image**
- Image: **Repeat Item**
- Width: 2048
- Height: Auto

### 5. Convert to JPEG (inside repeat block)
- Add action: **Convert Image**
- Convert: **Resized Image**
- To: **JPEG**
- Quality: 0.8

### 6. Encode to Base64 (inside repeat block)
- Add action: **Base64 Encode**
- Input: **Converted Image**

### 7. Format Date (inside repeat block)
- Add action: **Format Date**
- Date: **PhotoDate** variable
- Format: **Custom**
- Custom Format: `yyyy-MM-dd'T'HH:mm:ss.SSSXXX`
- Save to variable: `FormattedDate`

### 8. Upload to API (inside repeat block)
- Add action: **Get Contents of URL**
- URL: `https://yourdomain.com/api/photos/upload`
- Method: **POST**
- Headers:
  - `Content-Type`: `application/json`
  - `x-api-key`: `YOUR_API_KEY_HERE`
- Request Body: **JSON**
  ```json
  {
    "image": "data:image/jpeg;base64,[Base64 Encoded]",
    "timestamp": "[FormattedDate variable]"
  }
  ```

### 9. End Repeat
- The repeat block ends here

### 10. Show Notification
- Add action: **Show Notification**
- Title: "Photos Added"
- Body: "Added photos to website"

## Configuration

After creating the shortcut:

1. Tap the shortcut name at the top
2. Tap **Rename** to name it "Add to website"
3. Tap **Add to Home Screen** (optional)
4. In shortcut settings, enable **Show in Share Sheet**

## Usage

1. Open the **Photos** app
2. Select one or more photos
3. Tap the **Share** button
4. Scroll down and tap **Add to website**
5. Wait for the notification confirming upload

## Troubleshooting

**"Unauthorized" error**: Check that your API key matches the one in Vercel

**"Upload failed" error**: The image may be too large. Try reducing the resize dimensions.

**Photos not appearing**: Refresh the Photos app on your website. New photos are added in chronological order by their original timestamp.

## Security Notes

- The API key is stored in your Shortcuts app
- Only share the shortcut file with trusted users
- The API key has write-only access to the photos bucket
