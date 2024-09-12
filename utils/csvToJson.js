const csv = require("csv-parser");
const { Readable } = require("stream");

// Function to convert CSV string data to JSON
const csvToJson = (csvString) => {
  return new Promise((resolve, reject) => {
    const results = [];

    // Create a readable stream from the CSV string
    const stream = Readable.from([csvString]);

    stream
      .pipe(csv()) // Parse CSV using the csv-parser library
      .on("data", (data) => results.push(data)) // Push each parsed row into the results array
      .on("end", () => resolve(results)) // Resolve the promise once parsing is complete
      .on("error", (err) => reject(err)); // Reject the promise if there's an error
  });
};

module.exports = csvToJson;
