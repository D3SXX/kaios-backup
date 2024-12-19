const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function buildApp() {
    // Create output directory if it doesn't exist
    const inputDir = path.resolve(__dirname, '../dist');
    const outputDir = path.resolve(__dirname, './');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Create metadata.json
    const metadata = {
        version: 1.0,
        manifestURL: "app://kaiosbackup.d3sxx/manifest.webapp"
    };

    fs.writeFileSync(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    // Create application.zip from dist folder
    const applicationZip = fs.createWriteStream(path.join(outputDir, 'application.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(applicationZip);
    archive.directory(inputDir, false);
    await archive.finalize();

    // Create final app package
    const finalZip = fs.createWriteStream(path.join(outputDir, 'app.zip'));
    const finalArchive = archiver('zip', { zlib: { level: 9 } });

    finalArchive.pipe(finalZip);
    finalArchive.file(path.join(outputDir, 'metadata.json'), { name: 'metadata.json' });
    finalArchive.file(path.join(outputDir, 'application.zip'), { name: 'application.zip' });
    await finalArchive.finalize();

    // Clean up
    fs.unlinkSync(path.join(outputDir, 'metadata.json'));
    fs.unlinkSync(path.join(outputDir, 'application.zip'));

}

buildApp().catch(console.error);