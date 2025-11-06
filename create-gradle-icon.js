const fs = require('fs');

// Check if canvas is available
let createCanvas;
try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
} catch (error) {
    console.error('Error: canvas package is not installed.');
    console.error('');
    console.error('To install canvas and generate PNG icons:');
    console.error('  1. Install system dependencies (Fedora/RHEL):');
    console.error('     sudo dnf install cairo-devel giflib-devel libjpeg-turbo-devel pango-devel');
    console.error('  2. Install canvas package:');
    console.error('     npm install canvas --save-dev');
    console.error('');
    console.error('Alternatively, you can use the SVG icon (media/gradle-tasks-icon.svg)');
    console.error('and convert it to PNG using tools like Inkscape or online converters.');
    process.exit(1);
}

// Create a 128x128 canvas
const canvasInstance = createCanvas(128, 128);
const ctx = canvasInstance.getContext('2d');

// Create gradient background (Gradle green-blue theme)
const gradient = ctx.createLinearGradient(0, 0, 128, 128);
gradient.addColorStop(0, '#02303A');
gradient.addColorStop(1, '#0A7C8C');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

// Add rounded corners
ctx.globalCompositeOperation = 'destination-in';
ctx.beginPath();
ctx.roundRect(0, 0, 128, 128, 16);
ctx.fill();
ctx.globalCompositeOperation = 'source-over';

// Set drawing properties
ctx.strokeStyle = '#FFFFFF';
ctx.fillStyle = '#FFFFFF';
ctx.lineWidth = 4;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Draw main horizontal line (build flow)
ctx.beginPath();
ctx.moveTo(20, 64);
ctx.lineTo(108, 64);
ctx.stroke();

// Draw task nodes with shadows
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;

// Top row tasks (compile/test tasks - green)
ctx.fillStyle = '#4CAF50';
ctx.beginPath();
ctx.arc(40, 40, 12, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(64, 40, 12, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(88, 40, 12, 0, 2 * Math.PI);
ctx.fill();

// Middle row (main build tasks)
ctx.fillStyle = '#2196F3';
ctx.beginPath();
ctx.arc(40, 64, 14, 0, 2 * Math.PI);
ctx.fill();

ctx.fillStyle = '#FF9800';
ctx.beginPath();
ctx.arc(64, 64, 16, 0, 2 * Math.PI);
ctx.fill();

ctx.fillStyle = '#2196F3';
ctx.beginPath();
ctx.arc(88, 64, 14, 0, 2 * Math.PI);
ctx.fill();

// Bottom row tasks (clean/other tasks - gray)
ctx.fillStyle = '#9E9E9E';
ctx.beginPath();
ctx.arc(40, 88, 12, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(64, 88, 12, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(88, 88, 12, 0, 2 * Math.PI);
ctx.fill();

// Draw dependency connections
ctx.shadowBlur = 0;
ctx.strokeStyle = '#FFFFFF';
ctx.lineWidth = 2;
ctx.globalAlpha = 0.6;

// Top to middle dependencies
ctx.beginPath();
ctx.moveTo(40, 52);
ctx.lineTo(40, 50);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(64, 52);
ctx.lineTo(64, 50);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(88, 52);
ctx.lineTo(88, 50);
ctx.stroke();

// Horizontal dependencies in middle
ctx.beginPath();
ctx.moveTo(50, 64);
ctx.lineTo(54, 64);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(74, 64);
ctx.lineTo(78, 64);
ctx.stroke();

// Middle to bottom dependencies
ctx.beginPath();
ctx.moveTo(40, 76);
ctx.lineTo(40, 88);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(64, 76);
ctx.lineTo(64, 88);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(88, 76);
ctx.lineTo(88, 88);
ctx.stroke();

// Draw arrow heads for dependencies
ctx.globalAlpha = 1;
ctx.fillStyle = '#FFFFFF';
ctx.globalAlpha = 0.6;

// Arrow heads pointing down (top to middle)
drawArrow(ctx, 40, 50, 0);
drawArrow(ctx, 64, 50, 0);
drawArrow(ctx, 88, 50, 0);

// Arrow heads pointing right (left to center in middle)
drawArrow(ctx, 54, 64, Math.PI / 2);
drawArrow(ctx, 78, 64, Math.PI / 2);

// Arrow heads pointing down (middle to bottom)
drawArrow(ctx, 40, 88, 0);
drawArrow(ctx, 64, 88, 0);
drawArrow(ctx, 88, 88, 0);

// Center build task highlight (orange ring)
ctx.globalAlpha = 0.5;
ctx.strokeStyle = '#FFC107';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(64, 64, 18, 0, 2 * Math.PI);
ctx.stroke();

// Save as PNG
const buffer = canvasInstance.toBuffer('image/png');
fs.writeFileSync('media/main-icon.png', buffer);

console.log('Gradle Tasks PNG icon created successfully at media/main-icon.png');

// Helper function to draw arrow heads
function drawArrow(ctx, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

