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

// Create a 128x128 canvas for activity bar icon
const canvasInstance = createCanvas(128, 128);
const ctx = canvasInstance.getContext('2d');

// Clear canvas with transparent background
ctx.clearRect(0, 0, 128, 128);

// Create gradient background (Gradle theme)
const gradient = ctx.createLinearGradient(0, 0, 128, 128);
gradient.addColorStop(0, '#02303A');
gradient.addColorStop(1, '#0A7C8C');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

// Set drawing properties
ctx.strokeStyle = '#FFFFFF';
ctx.fillStyle = '#FFFFFF';
ctx.lineWidth = 6;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Draw main horizontal line (build flow)
ctx.beginPath();
ctx.moveTo(20, 64);
ctx.lineTo(108, 64);
ctx.stroke();

// Draw task nodes
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;

// Top row tasks (green - compile/test)
ctx.fillStyle = '#4CAF50';
ctx.beginPath();
ctx.arc(40, 40, 10, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(64, 40, 10, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(88, 40, 10, 0, 2 * Math.PI);
ctx.fill();

// Middle row (main build tasks)
ctx.fillStyle = '#2196F3';
ctx.beginPath();
ctx.arc(40, 64, 12, 0, 2 * Math.PI);
ctx.fill();

ctx.fillStyle = '#FF9800';
ctx.beginPath();
ctx.arc(64, 64, 14, 0, 2 * Math.PI);
ctx.fill();

ctx.fillStyle = '#2196F3';
ctx.beginPath();
ctx.arc(88, 64, 12, 0, 2 * Math.PI);
ctx.fill();

// Bottom row tasks (gray - clean/other)
ctx.fillStyle = '#9E9E9E';
ctx.beginPath();
ctx.arc(40, 88, 10, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(64, 88, 10, 0, 2 * Math.PI);
ctx.fill();

ctx.beginPath();
ctx.arc(88, 88, 10, 0, 2 * Math.PI);
ctx.fill();

// Draw dependency connections
ctx.shadowBlur = 0;
ctx.strokeStyle = '#FFFFFF';
ctx.lineWidth = 3;
ctx.globalAlpha = 0.7;

// Top to middle
ctx.beginPath();
ctx.moveTo(40, 50);
ctx.lineTo(40, 52);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(64, 50);
ctx.lineTo(64, 52);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(88, 50);
ctx.lineTo(88, 52);
ctx.stroke();

// Horizontal in middle
ctx.beginPath();
ctx.moveTo(50, 64);
ctx.lineTo(54, 64);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(74, 64);
ctx.lineTo(78, 64);
ctx.stroke();

// Middle to bottom
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

// Draw arrow heads
ctx.globalAlpha = 0.7;
ctx.fillStyle = '#FFFFFF';

// Top to middle arrows
drawArrow(ctx, 40, 52, 0);
drawArrow(ctx, 64, 52, 0);
drawArrow(ctx, 88, 52, 0);

// Horizontal arrows
drawArrow(ctx, 54, 64, Math.PI / 2);
drawArrow(ctx, 78, 64, Math.PI / 2);

// Middle to bottom arrows
drawArrow(ctx, 40, 88, 0);
drawArrow(ctx, 64, 88, 0);
drawArrow(ctx, 88, 88, 0);

// Save as PNG
const buffer = canvasInstance.toBuffer('image/png');
fs.writeFileSync('media/activity-icon.png', buffer);

console.log('Gradle Tasks activity bar PNG icon created successfully at media/activity-icon.png');

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

