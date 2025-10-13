# Assets Directory

This directory should contain:

- `icon.png` - App icon (1024x1024 px)
- `splash.png` - Splash screen image (1242x2436 px for iPhone X)
- `adaptive-icon.png` - Android adaptive icon (1024x1024 px)
- `favicon.png` - Web favicon (32x32 px)

## Temporary Solution

For now, you can:

1. **Download default Expo assets** from: https://github.com/expo/expo/tree/main/templates/expo-template-blank/assets

2. **Or create simple colored images:**
   - Create a 1024x1024 green image for icon.png
   - Create a 1242x2436 green image with white "Adbeam Recycling" text for splash.png
   - Copy icon.png as adaptive-icon.png
   - Create a 32x32 version as favicon.png

3. **Quick fix:** Add these files to your `assets/` folder:
   ```
   assets/
   ├── icon.png
   ├── splash.png
   ├── adaptive-icon.png
   └── favicon.png
   ```

## Temporary App.json Override

If you don't have assets yet, update app.json to remove asset references temporarily:

```json
{
  "expo": {
    "name": "Adbeam Recycling",
    "slug": "adbeam-recycling-v2",
    "version": "2.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "splash": {
      "backgroundColor": "#4CAF50"
    }
  }
}
```