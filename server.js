const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

// ==========================================
// BASIC SERVER SETTINGS
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// SERVE THE WEBSITE
// ==========================================

app.use(express.static(__dirname));


// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});


// ==========================================
// CREATE BOOKING
// ==========================================

app.post("/booking", (req, res) => {

    const {
        name,
        email,
        phone,
        massage,
        date,
        time
    } = req.body;


    // CHECK REQUIRED INFORMATION
    if (
        !name ||
        !email ||
        !phone ||
        !massage ||
        !date ||
        !time
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Please complete all booking fields."
        });
    }


    // ======================================
    // CHECK DATE
    // ======================================

    const now = new Date();

    const today =
        `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}-${String(
            now.getDate()
        ).padStart(2, "0")}`;


    if (date < today) {

        return res.status(400).json({
            success: false,
            message:
                "Please select today or a future date."
        });
    }


    // ======================================
    // CHECK BUSINESS HOURS
    // 7 AM - 12 AM
    // LAST BOOKING = 11 PM
    // ======================================

    const selectedHour =
        Number(time.split(":")[0]);


    if (
        selectedHour < 7 ||
        selectedHour > 23
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Please choose a time between 7:00 AM and 11:00 PM."
        });
    }


    // ======================================
    // LOAD EXISTING BOOKINGS
    // ======================================

    let bookings = [];


    try {

        if (
            fs.existsSync(
                BOOKINGS_FILE
            )
        ) {

            const fileData =
                fs.readFileSync(
                    BOOKINGS_FILE,
                    "utf8"
                );

            bookings =
                JSON.parse(fileData);
        }

    } catch (error) {

        console.error(
            "Could not read bookings:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Could not load bookings."
        });
    }


    // ======================================
    // PREVENT DOUBLE BOOKING
    // ======================================

    const alreadyBooked =
        bookings.some(
            booking =>
                booking.date === date &&
                booking.time === time
        );


    if (alreadyBooked) {

        return res.status(409).json({
            success: false,
            message:
                "This date and time is already booked. Please choose another time."
        });
    }


    // ======================================
    // CREATE NEW BOOKING
    // ======================================

    const newBooking = {

        id: Date.now(),

        name: name,

        email: email,

        phone: phone,

        massage: massage,

        date: date,

        time: time,

        status: "Pending",

        createdAt:
            new Date().toISOString()
    };


    bookings.push(newBooking);


    // ======================================
    // SAVE BOOKING
    // ======================================

    try {

        fs.writeFileSync(
            BOOKINGS_FILE,
            JSON.stringify(
                bookings,
                null,
                2
            )
        );

    } catch (error) {

        console.error(
            "Could not save booking:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Could not save your booking."
        });
    }


    // ======================================
    // SERVER CONSOLE
    // ======================================

    console.log("");
    console.log(
        "================================"
    );
    console.log(
        "NEW LUXE MASSAGE BOOKING"
    );
    console.log(
        "================================"
    );
    console.log(
        "Name:",
        newBooking.name
    );
    console.log(
        "Email:",
        newBooking.email
    );
    console.log(
        "Phone:",
        newBooking.phone
    );
    console.log(
        "Massage:",
        newBooking.massage
    );
    console.log(
        "Date:",
        newBooking.date
    );
    console.log(
        "Time:",
        newBooking.time
    );
    console.log(
        "================================"
    );
    console.log("");


    // ======================================
    // SUCCESS RESPONSE
    // ======================================

    res.json({

        success: true,

        message:
            "Booking saved successfully.",

        bookingId:
            newBooking.id
    });

});


// ==========================================
// GET BOOKINGS
// ADMIN DASHBOARD USES THIS
// ==========================================

app.get("/bookings", (req, res) => {

    try {

        if (
            !fs.existsSync(
                BOOKINGS_FILE
            )
        ) {

            return res.json([]);
        }


        const fileData =
            fs.readFileSync(
                BOOKINGS_FILE,
                "utf8"
            );


        const bookings =
            JSON.parse(fileData);


        res.json(bookings);

    } catch (error) {

        console.error(
            "Could not load bookings:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Could not load bookings."
        });
    }
});


// ==========================================
// GET BOOKED TIMES
// ==========================================

app.get(
    "/booked-times",
    (req, res) => {

        const selectedDate =
            req.query.date;


        if (!selectedDate) {

            return res.status(400).json({
                success: false,
                message:
                    "Please provide a date."
            });
        }


        try {

            if (
                !fs.existsSync(
                    BOOKINGS_FILE
                )
            ) {

                return res.json([]);
            }


            const fileData =
                fs.readFileSync(
                    BOOKINGS_FILE,
                    "utf8"
                );


            const bookings =
                JSON.parse(fileData);


            const bookedTimes =
                bookings
                    .filter(
                        booking =>
                            booking.date ===
                            selectedDate
                    )
                    .map(
                        booking =>
                            booking.time
                    );


            res.json(bookedTimes);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Could not load booked times."
            });
        }
    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "       LUXE MASSAGE"
        );
        console.log(
            "================================"
        );
        console.log(
            `Website: http://localhost:${PORT}`
        );
        console.log(
            `Admin:   http://localhost:${PORT}/admin.html`
        );
        console.log(
            "================================"
        );
        console.log("");
    }
);