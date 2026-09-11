const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ==========================================
// CREATE DATABASE TABLE
// ==========================================

async function setupDatabase() {

    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                massage TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date, time)
            );
        `);

        console.log("Database ready.");

    } catch (error) {

        console.error(
            "Database setup error:",
            error
        );

    }
}


// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );

});


// ==========================================
// CREATE BOOKING
// ==========================================

app.post("/booking", async (req, res) => {

    const {
        name,
        email,
        phone,
        massage,
        date,
        time
    } = req.body;


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
    // SAVE BOOKING
    // ======================================

    try {

        const result =
            await pool.query(

                `
                INSERT INTO bookings
                (
                    name,
                    email,
                    phone,
                    massage,
                    date,
                    time
                )

                VALUES
                ($1, $2, $3, $4, $5, $6)

                RETURNING id;
                `,

                [
                    name,
                    email,
                    phone,
                    massage,
                    date,
                    time
                ]

            );


        const bookingId =
            result.rows[0].id;


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
            name
        );

        console.log(
            "Email:",
            email
        );

        console.log(
            "Phone:",
            phone
        );

        console.log(
            "Massage:",
            massage
        );

        console.log(
            "Date:",
            date
        );

        console.log(
            "Time:",
            time
        );

        console.log(
            "================================"
        );

        console.log("");


        res.json({

            success: true,

            message:
                "Booking saved successfully.",

            bookingId:
                bookingId

        });


    } catch (error) {

        // Duplicate date + time

        if (
            error.code === "23505"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This date and time is already booked. Please choose another time."

            });

        }


        console.error(
            "Booking database error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Could not save your booking."

        });

    }

});


// ==========================================
// GET ALL BOOKINGS
// ADMIN DASHBOARD
// ==========================================

app.get("/bookings", async (req, res) => {

    try {

        const result =
            await pool.query(`

                SELECT
                    id,
                    name,
                    email,
                    phone,
                    massage,
                    date,
                    time,
                    status,
                    created_at

                FROM bookings

                ORDER BY id DESC;

            `);


        const bookings =
            result.rows.map(
                booking => ({

                    id:
                        booking.id,

                    name:
                        booking.name,

                    email:
                        booking.email,

                    phone:
                        booking.phone,

                    massage:
                        booking.massage,

                    date:
                        booking.date,

                    time:
                        booking.time,

                    status:
                        booking.status,

                    createdAt:
                        booking.created_at

                })
            );


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
    async (req, res) => {

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

            const result =
                await pool.query(

                    `
                    SELECT time
                    FROM bookings
                    WHERE date = $1;
                    `,

                    [selectedDate]

                );


            const bookedTimes =
                result.rows.map(
                    booking =>
                        booking.time
                );


            res.json(
                bookedTimes
            );


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

async function startServer() {

    await setupDatabase();


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

}


startServer();