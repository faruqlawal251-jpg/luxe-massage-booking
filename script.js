// ==========================================
// LUXE MASSAGE BOOKING
// ==========================================


const bookingForm =
    document.getElementById("bookingForm");

const dateInput =
    document.getElementById("date");

const timeInput =
    document.getElementById("time");

const submitButton =
    document.getElementById("submitButton");


// ==========================================
// TODAY
// ==========================================

const today =
    new Date();

const todayFormatted =
    `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, "0")}-${String(
        today.getDate()
    ).padStart(2, "0")}`;

dateInput.min =
    todayFormatted;


// ==========================================
// TIME SLOTS
// 7 AM - 11 PM
// ==========================================

const timeSlots = [

    {
        value: "07:00",
        label: "7:00 AM"
    },

    {
        value: "08:00",
        label: "8:00 AM"
    },

    {
        value: "09:00",
        label: "9:00 AM"
    },

    {
        value: "10:00",
        label: "10:00 AM"
    },

    {
        value: "11:00",
        label: "11:00 AM"
    },

    {
        value: "12:00",
        label: "12:00 PM"
    },

    {
        value: "13:00",
        label: "1:00 PM"
    },

    {
        value: "14:00",
        label: "2:00 PM"
    },

    {
        value: "15:00",
        label: "3:00 PM"
    },

    {
        value: "16:00",
        label: "4:00 PM"
    },

    {
        value: "17:00",
        label: "5:00 PM"
    },

    {
        value: "18:00",
        label: "6:00 PM"
    },

    {
        value: "19:00",
        label: "7:00 PM"
    },

    {
        value: "20:00",
        label: "8:00 PM"
    },

    {
        value: "21:00",
        label: "9:00 PM"
    },

    {
        value: "22:00",
        label: "10:00 PM"
    },

    {
        value: "23:00",
        label: "11:00 PM"
    }

];


// ==========================================
// LOAD AVAILABLE TIMES
// ==========================================

async function loadAvailableTimes() {

    const selectedDate =
        dateInput.value;


    if (!selectedDate) {

        timeInput.innerHTML =
            `
            <option value="">
                Select a date first
            </option>
            `;

        return;
    }


    timeInput.innerHTML =
        `
        <option value="">
            Checking available times...
        </option>
        `;


    try {

        const response =
            await fetch(
                `/booked-times?date=${encodeURIComponent(
                    selectedDate
                )}`
            );


        if (!response.ok) {

            throw new Error(
                "Could not load booked times."
            );
        }


        const bookedTimes =
            await response.json();


        timeInput.innerHTML =
            `
            <option value="">
                Select a time
            </option>
            `;


        timeSlots.forEach(
            slot => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    slot.value;


                if (
                    bookedTimes.includes(
                        slot.value
                    )
                ) {

                    option.textContent =
                        `${slot.label} — Already Booked`;

                    option.disabled =
                        true;

                } else {

                    option.textContent =
                        `${slot.label} — Available`;
                }


                timeInput.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

        timeInput.innerHTML =
            `
            <option value="">
                Could not load times
            </option>
            `;
    }
}


dateInput.addEventListener(
    "change",
    loadAvailableTimes
);


// ==========================================
// FORM SUBMISSION
// ==========================================

bookingForm.addEventListener(
    "submit",
    async function(event) {

        // STOP NORMAL HTML SUBMISSION
        event.preventDefault();


        const name =
            document
                .getElementById("name")
                .value
                .trim();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const phone =
            document
                .getElementById("phone")
                .value
                .trim();


        const massage =
            document
                .getElementById("massage")
                .value;


        const date =
            dateInput.value;


        const time =
            timeInput.value;


        // ==================================
        // VALIDATION
        // ==================================

        if (
            !name ||
            !email ||
            !phone ||
            !massage ||
            !date ||
            !time
        ) {

            alert(
                "Please complete all booking fields."
            );

            return;
        }


        if (
            date < todayFormatted
        ) {

            alert(
                "Please select today or a future date."
            );

            return;
        }


        // ==================================
        // DISABLE BUTTON
        // ==================================

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Submitting Booking...";


        // ==================================
        // SEND TO SERVER
        // ==================================

        try {

            const response =
                await fetch(
                    "/booking",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                name:
                                    name,

                                email:
                                    email,

                                phone:
                                    phone,

                                massage:
                                    massage,

                                date:
                                    date,

                                time:
                                    time
                            })
                    }
                );


            const result =
                await response.json();


            // ==================================
            // SUCCESS
            // ==================================

            if (
                response.ok &&
                result.success
            ) {

                // SAVE BOOKING TEMPORARILY
                // FOR THE SUCCESS PAGE

                const bookingForCustomer = {

                    name:
                        name,

                    email:
                        email,

                    phone:
                        phone,

                    massage:
                        massage,

                    date:
                        date,

                    time:
                        formatTime(time)
                };


                sessionStorage.setItem(
                    "luxeMassageBooking",
                    JSON.stringify(
                        bookingForCustomer
                    )
                );


                // GO TO SUCCESS PAGE

                window.location.href =
                    "/booking-success.html";


                return;
            }


            // ==================================
            // DOUBLE BOOKING
            // ==================================

            if (
                response.status === 409
            ) {

                alert(
                    result.message
                );

                await loadAvailableTimes();

                return;
            }


            // ==================================
            // OTHER ERROR
            // ==================================

            alert(
                result.message ||
                "Something went wrong. Please try again."
            );


        } catch (error) {

            console.error(
                "Booking error:",
                error
            );

            alert(
                "Could not connect to the booking server. Please make sure the server is running."
            );

        } finally {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Book My Massage";
        }

    }
);


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(time) {

    const parts =
        time.split(":");

    let hour =
        Number(parts[0]);

    const minutes =
        parts[1];

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minutes} ${period}`;
}