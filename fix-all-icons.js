const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const filesToFix = [
  'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set.js',
  'node_modules/@expo/vector-icons/build/createIconSet.js',
  'node_modules/@expo/vector-icons/src/vendor/react-native-vector-icons/lib/create-icon-set.js',
  'node_modules/@expo/vector-icons/src/createIconSet.js',
];

const fixContent = (content) => {
  return content.replace(
    /const _missingAssetRegistryPath = require\("missing-asset-registry-path"\);?/g,
    'const _missingAssetRegistryPath = { registerAsset: () => 1 };'
  );
};

console.log('🔧 Fixing all @expo/vector-icons files...');

let fixedCount = 0;
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      const newContent = fixContent(content);
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        fixedCount++;
      } else {
        console.log(`ℹ️  Already fixed: ${filePath}`);
      }
    } catch (error) {
      console.log(`❌ Error fixing ${filePath}:`, error.message);
    }
  } else {
    console.log(`📁 Not found: ${filePath}`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files successfully!`);
console.log('🚀 Restart your development server: npx expo start --clear');