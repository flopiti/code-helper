const fs = require('fs');

// Define the file path
const filePath = '/Users/nathanpieraut/projects/natetrystuff-api/natetrystuff/src/main/java/com/natetrystuff/Meal/MealController.java'; // Update this to your actual file path

console.log(`Waiting 15 seconds before appending text to ${filePath}...`);

// Schedule appending text 15 seconds after script starts
setTimeout(() => {
    console.log('Appending text now...');
    fs.appendFile(filePath, '\nshiverrish', 'utf8', (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        } else {
            console.log('Successfully added "shiverrish" to the end of the file');
        }
    });
}, 4000); // 15000 milliseconds = 15 seconds
