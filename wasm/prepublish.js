const fs = require('fs');
const path = require('path');

try {
  const pkgPath = path.join(__dirname, "pkg-parallel/package.json");

  // Check if package.json exists
  if (!fs.existsSync(pkgPath)) {
    console.error(`Error: File ${pkgPath} not found.`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  // Add snippets to the files array. If no files array exists, create one.
  pkg.files = pkg.files || [];
  if (!pkg.files.includes('snippets/')) {
    pkg.files.push('snippets/');
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Successfully added "snippets/" to package.json.');
  } else {
    console.log('"snippets/" already exists in package.json.');
  }
} catch (error) {
  console.error(`An error occurred: ${error.message}`);
  process.exit(1);
}