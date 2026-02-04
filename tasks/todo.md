# TODO

## Preview App Issues

### 1. ~~Dock doesn't extend when Preview is open~~ ✓ FIXED
- ~~When Preview windows are open, the dock needs to extend so all icons fit~~
- ~~Currently, the Trash icon gets hidden when too many apps are in the dock~~
- ~~Need to make the dock responsive to the number of visible apps~~
- **Solution**: Dock icons now dynamically shrink based on viewport width

### 2. Handle all file types in Finder
- Many file types aren't categorized as text or image (e.g., `.mjs`, `.woff`, etc.)
- **Proposed solution**: Whitelist image extensions only, open everything else in TextEdit by default
- Image extensions to whitelist: `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`, `ico`
- PDF handled separately
- All other extensions → TextEdit
