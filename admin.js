/* =========================================
   HOTEL ADMIN PANEL - FIREBASE REALTIME VERSION
========================================= */

const DB_KEY = "adminUsers";
const BOOKING_KEY = "hotelBookings"; 
let adminBookings = []; // Store bookings for admin panel

// 1. Initialize Default Admin
function initAdmins() {
    let users = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    if (users.length === 0 || !users.some(u => u.u.toLowerCase() === "tirth")) {
        users.unshift({ u: "Tirth", p: "Tirth2007", role: "primary" }); 
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    }
}
initAdmins();

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// 2. LOGIN FUNCTION
function login() {
    const userIn = document.getElementById("adminUser").value.trim();
    const passIn = document.getElementById("adminPass").value.trim();

    if(!userIn || !passIn) {
        alert("Please enter Username and Password");
        return;
    }

    const users = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const validUser = users.find(a => a.u.toLowerCase() === userIn.toLowerCase() && a.p === passIn);

    if (validUser) {
        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminUser", validUser.u);
        showDashboard();
    } else {
        alert("Invalid Username or Password!");
    }
}

// 3. RESET PASSWORD
function updatePassword() {
    const user = document.getElementById("resetUser").value.trim();
    const pass = document.getElementById("newAdminPass").value.trim();

    if(!user || !pass) {
        alert("Please fill all fields");
        return;
    }

    let users = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const accIndex = users.findIndex(a => a.u.toLowerCase() === user.toLowerCase());
    
    if (accIndex === -1) {
        alert("User not found!");
        return;
    }

    users[accIndex].p = pass;
    localStorage.setItem(DB_KEY, JSON.stringify(users));

    alert("Password updated!");
    toggleView("login");
}

// --- DASHBOARD ---
function showDashboard() {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("activeUserDisplay").innerHTML = `<b>Welcome, ${sessionStorage.getItem("adminUser")}</b>`;
    loadData();
}

// 4. LOAD BOOKINGS - Firebase Realtime
function loadData() {
    if (!window.firebaseServices) {
        console.log('Firebase not ready, using localStorage fallback');
        let bookings = JSON.parse(localStorage.getItem(BOOKING_KEY)) || [];
        renderBookingsTable(bookings);
        return;
    }

    const { database, ref, onValue } = window.firebaseServices;
    const bookingsRef = ref(database, 'bookings');
    
    // Set up real-time listener
    onValue(bookingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert Firebase object to array
            adminBookings = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            // Sort by booking date descending
            adminBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        } else {
            adminBookings = [];
        }
        renderBookingsTable(adminBookings);
    });
}

// Render bookings table
function renderBookingsTable(bookings) {
    const bookingTable = document.getElementById("bookingTable");
    bookingTable.innerHTML = "";
    let revenue = 0;

    bookings.forEach((b, i) => {
        revenue += parseFloat(b.totalAmount || 0);
        bookingTable.innerHTML += `
            <tr>
                <td>${b.id || '-'}</td>
                <td>${b.customerName}</td>
                <td>${b.customerEmail}</td>
                <td>${b.customerPhone}</td>
                <td>${formatDate(b.checkIn)}</td>
                <td>${formatDate(b.checkOut)}</td>
                <td>${b.type}</td>
                <td>${b.itemName}</td>
                <td>${b.guests}</td>
                <td>₹${b.totalAmount}</td>
                <td>
                    <button onclick="editBooking('${b.id}')" style="background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right: 5px;">Edit</button>
                    <button onclick="deleteBooking('${b.id}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                </td>
            </tr>`;
    });
    document.getElementById("totalBookings").innerText = bookings.length;
    document.getElementById("totalRevenue").innerText = revenue;
}

// 5. DELETE BOOKING - Firebase
function deleteBooking(bookingId) {
    if(confirm("Delete this booking?")) {
        if (!window.firebaseServices) {
            // Fallback to localStorage
            adminBookings = adminBookings.filter(b => b.id !== bookingId);
            localStorage.setItem(BOOKING_KEY, JSON.stringify(adminBookings));
            renderBookingsTable(adminBookings);
            return;
        }

        const { database, ref, remove } = window.firebaseServices;
        const bookingRef = ref(database, 'bookings/' + bookingId);
        remove(bookingRef).then(() => {
            console.log('Booking deleted from Firebase!');
        }).catch((error) => {
            console.error('Error deleting booking:', error);
            // Fallback to localStorage
            adminBookings = adminBookings.filter(b => b.id !== bookingId);
            localStorage.setItem(BOOKING_KEY, JSON.stringify(adminBookings));
            renderBookingsTable(adminBookings);
        });
    }
}

// 5A. OPEN BOOKING FORM FOR NEW BOOKING
function openBookingForm() {
    resetBookingForm();
    document.getElementById("modalTitle").innerText = "Add New Booking";
    document.getElementById("bookingModal").classList.add("active");
    document.getElementById("bookingForm").dataset.editIndex = "";
    loadItemOptions();
    
    // Add event listeners for automatic price calculation
    document.getElementById("checkIn").addEventListener('change', calculateAdminPrice);
    document.getElementById("checkOut").addEventListener('change', calculateAdminPrice);
    document.getElementById("bookingType").addEventListener('change', calculateAdminPrice);
    document.getElementById("bookingType").addEventListener('change', updateEventTimeField);
    document.getElementById("itemName").addEventListener('change', updateGuestLimit);
    
    setTimeout(() => document.getElementById("customerName").focus(), 100);
}

// Update guest limit based on selected item
function updateGuestLimit() {
    const bookingType = document.getElementById("bookingType").value;
    const itemSelect = document.getElementById("itemName");
    const guestsInput = document.getElementById("guests");
    const guestsLabel = document.querySelector('label[for="guests"]');
    
    let selectedItem;
    if (bookingType === "Room" || bookingType === "room") {
        const rooms = [
            { name: "Deluxe Single Room", capacity: 2 },
            { name: "Executive Double Room", capacity: 4 },
            { name: "Presidential Suite", capacity: 6 },
            { name: "Family Suite", capacity: 5 }
        ];
        selectedItem = rooms.find(r => r.name === itemSelect.value);
    } else if (bookingType === "Hall" || bookingType === "hall") {
        const halls = [
            { name: "Conference Hall", capacity: 100 },
            { name: "Banquet Hall", capacity: 300 },
            { name: "Party Hall", capacity: 150 }
        ];
        selectedItem = halls.find(h => h.name === itemSelect.value);
    }
    
    if (selectedItem) {
        guestsInput.max = selectedItem.capacity;
        if (guestsInput.value > selectedItem.capacity) {
            guestsInput.value = selectedItem.capacity;
        }
        if (guestsLabel) {
            guestsLabel.textContent = `Number of Guests (Max: ${selectedItem.capacity})`;
        }
    } else {
        guestsInput.max = 300;
        if (guestsLabel) {
            guestsLabel.textContent = 'Number of Guests';
        }
    }
}

// Show/Hide Event Time Field based on booking type
function updateEventTimeField() {
    const bookingType = document.getElementById("bookingType").value;
    const eventTimeGroup = document.getElementById("eventTimeGroup");
    const eventTimeInput = document.getElementById("eventTime");
    
    if (bookingType === "Hall" || bookingType === "hall") {
        eventTimeGroup.style.display = "block";
        eventTimeInput.required = true;
    } else {
        eventTimeGroup.style.display = "none";
        eventTimeInput.required = false;
        eventTimeInput.value = "";
    }
}

// 5B. EDIT BOOKING
function editBooking(bookingId) {
    const booking = adminBookings.find(b => b.id === bookingId);
    if (!booking) {
        alert("Booking not found!");
        return;
    }
    
    document.getElementById("modalTitle").innerText = "Edit Booking";
    document.getElementById("customerName").value = booking.customerName || "";
    document.getElementById("customerEmail").value = booking.customerEmail || "";
    document.getElementById("customerPhone").value = booking.customerPhone || "";
    document.getElementById("bookingType").value = booking.type || "";
    document.getElementById("checkIn").value = booking.checkIn || "";
    document.getElementById("checkOut").value = booking.checkOut || "";
    document.getElementById("guests").value = booking.guests || "";
    document.getElementById("totalAmount").value = booking.totalAmount || "";
    document.getElementById("eventTime").value = booking.eventTime || "";
    
    document.getElementById("bookingForm").dataset.editId = bookingId;
    document.getElementById("bookingModal").classList.add("active");
    loadItemOptions(booking.type);
    
    setTimeout(() => {
        document.getElementById("itemName").value = booking.itemName || "";
        updateEventTimeField();
        updateGuestLimit();
        updatePriceSummary();
    }, 100);
}

// 5C. CLOSE BOOKING FORM
function closeBookingForm() {
    document.getElementById("bookingModal").classList.remove("active");
    resetBookingForm();
    removeElement("priceSummaryDiv");
}

// Helper function to remove element
function removeElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.remove();
}

// 5D. RESET BOOKING FORM
function resetBookingForm() {
    document.getElementById("bookingForm").reset();
    document.getElementById("bookingForm").dataset.editId = "";
}

// 5E. LOAD ITEM OPTIONS BASED ON TYPE
function loadItemOptions(type = null) {
    const selectedType = type || document.getElementById("bookingType").value;
    const itemSelect = document.getElementById("itemName");
    itemSelect.innerHTML = "<option value=''>Select Item</option>";
    
    if (selectedType === "Room" || selectedType === "room") {
        const rooms = [
            { name: "Deluxe Single Room", price: 2500 },
            { name: "Executive Double Room", price: 4000 },
            { name: "Presidential Suite", price: 8000 },
            { name: "Family Suite", price: 6000 }
        ];
        rooms.forEach(room => {
            itemSelect.innerHTML += `<option value="${room.name}" data-price="${room.price}">${room.name} (₹${room.price}/night)</option>`;
        });
    } else if (selectedType === "Hall" || selectedType === "hall") {
        const halls = [
            { name: "Conference Hall", price: 15000 },
            { name: "Banquet Hall", price: 30000 },
            { name: "Party Hall", price: 20000 }
        ];
        halls.forEach(hall => {
            itemSelect.innerHTML += `<option value="${hall.name}" data-price="${hall.price}">${hall.name} (₹${hall.price})</option>`;
        });
    }
    
    // Add event listeners to item select
    itemSelect.addEventListener('change', calculateAdminPrice);
    itemSelect.addEventListener('change', updateGuestLimit);
}

// 5F. UPDATE ITEM OPTIONS WHEN TYPE CHANGES
function updateItemOptions() {
    loadItemOptions();
    calculateAdminPrice();
    updateGuestLimit();
    updateEventTimeField();
}

// 5H. CALCULATE PRICE AUTOMATICALLY BASED ON DATES AND ITEM
function calculateAdminPrice() {
    const itemSelect = document.getElementById("itemName");
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    const bookingType = document.getElementById("bookingType").value;
    const totalAmountInput = document.getElementById("totalAmount");
    
    let total = 0;
    
    if (price && checkIn && checkOut && bookingType === "Room") {
        // For rooms, calculate price per nights
        const nights = calculateNights(checkIn, checkOut);
        total = price * nights;
    } else if (price && bookingType === "Hall") {
        // For halls, it's a fixed price
        total = price;
    }
    
    totalAmountInput.value = total > 0 ? total : "";
    updatePriceSummary();
}

// 5I. UPDATE PRICE SUMMARY DISPLAY
function updatePriceSummary() {
    const totalAmountInput = document.getElementById("totalAmount");
    const totalAmount = parseFloat(totalAmountInput.value) || 0;
    const bookingType = document.getElementById("bookingType").value;
    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;

    let summaryHtml = `<div class="price-row"><span>Total:</span><span class="price-amount">Rs. ${totalAmount.toLocaleString('en-IN')}</span></div>`;
    if (bookingType === "Room" && checkIn && checkOut) {
        const nights = calculateNights(checkIn, checkOut);
        summaryHtml += `<div style="color: #9aa0a6; margin-top: 0.5rem; font-size: 0.9rem;">Duration: ${nights} night${nights > 1 ? 's' : ''}</div>`;
    }

    // Update the static price-summary element inside the admin modal (added to HTML to match main site)
    const summaryDiv = document.querySelector('#bookingModal .price-summary');
    if (summaryDiv) {
        summaryDiv.innerHTML = summaryHtml;
    }
}

// Helper function to calculate nights
function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

// 5G. SAVE BOOKING (ADD OR EDIT) - Firebase
function saveBooking(event) {
    event.preventDefault();
    
    const customerName = document.getElementById("customerName").value.trim();
    const customerEmail = document.getElementById("customerEmail").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const type = document.getElementById("bookingType").value.trim();
    const itemName = document.getElementById("itemName").value.trim();
    const guests = document.getElementById("guests").value.trim();
    const checkIn = document.getElementById("checkIn").value.trim();
    const checkOut = document.getElementById("checkOut").value.trim();
    const totalAmount = document.getElementById("totalAmount").value.trim();
    const eventTime = document.getElementById("eventTime").value.trim();
    const editId = document.getElementById("bookingForm").dataset.editId;
    
    if (!customerName || !customerEmail || !customerPhone || !type || !itemName || !guests || !checkIn || !checkOut || !totalAmount) {
        alert("Please fill all fields");
        return;
    }
    
    // Validate event time for halls
    if ((type === "Hall" || type === "hall") && !eventTime) {
        alert("Please select event time for hall bookings");
        return;
    }
    
    const newBooking = {
        id: editId || "BK" + Date.now(),
        customerName,
        customerEmail,
        customerPhone,
        type,
        itemName,
        guests: parseInt(guests),
        checkIn,
        checkOut,
        totalAmount: parseFloat(totalAmount),
        eventTime: eventTime || null,
        bookingDate: new Date().toISOString()
    };
    
    if (!window.firebaseServices) {
        // Fallback to localStorage
        if (editId) {
            const index = adminBookings.findIndex(b => b.id === editId);
            if (index !== -1) adminBookings[index] = newBooking;
        } else {
            adminBookings.push(newBooking);
        }
        localStorage.setItem(BOOKING_KEY, JSON.stringify(adminBookings));
        closeBookingForm();
        renderBookingsTable(adminBookings);
        alert(editId ? "Booking updated successfully!" : "Booking added successfully!");
        return;
    }

    const { database, ref, set } = window.firebaseServices;
    const bookingRef = ref(database, 'bookings/' + newBooking.id);
    
    set(bookingRef, newBooking).then(() => {
        console.log('Booking saved to Firebase!');
        closeBookingForm();
        alert(editId ? "Booking updated successfully!" : "Booking added successfully!");
    }).catch((error) => {
        console.error('Error saving booking:', error);
        // Fallback to localStorage
        if (editId) {
            const index = adminBookings.findIndex(b => b.id === editId);
            if (index !== -1) adminBookings[index] = newBooking;
        } else {
            adminBookings.push(newBooking);
        }
        localStorage.setItem(BOOKING_KEY, JSON.stringify(adminBookings));
        closeBookingForm();
        renderBookingsTable(adminBookings);
        alert(editId ? "Booking updated!" : "Booking added! (offline)");
    });
}

// 6. CLEAR ALL - Firebase
function clearAll() {
    if (confirm("Delete ALL bookings?")) {
        if (!window.firebaseServices) {
            // Fallback to localStorage
            adminBookings = [];
            localStorage.setItem(BOOKING_KEY, JSON.stringify([]));
            renderBookingsTable(adminBookings);
            return;
        }

        const { database, ref, remove } = window.firebaseServices;
        const bookingsRef = ref(database, 'bookings');
        
        remove(bookingsRef).then(() => {
            console.log('All bookings cleared from Firebase!');
        }).catch((error) => {
            console.error('Error clearing bookings:', error);
            // Fallback to localStorage
            adminBookings = [];
            localStorage.setItem(BOOKING_KEY, JSON.stringify([]));
            renderBookingsTable(adminBookings);
        });
    }
}

function logout() {
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("adminUser");
    sessionStorage.removeItem("primaryAdminVerified");
    location.reload();
}

// Helper function to load image as base64 for PDF watermark
function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
        };
        img.onerror = function() {
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
}

// 7. DOWNLOAD CUSTOMER PDF
async function downloadCustomerdetailsPDF() {
    if (adminBookings.length === 0) {
        alert("No bookings available to download!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const hotelName = "HOTEL GRAND PLAZA";
    const hotelAddress = "Hotel Grand Plaza, Ahmedabad";
    const hotelPhone = "+91 98765 43210";
    const hotelEmail = "hotegrandplaza@gamil.com";

    // Add logo image to header (left side, above orange line)
    try {
        const logoUrl = "Hotel Grand Plaza Logo.png";
        const logoImg = await loadImageAsBase64(logoUrl);
        doc.addImage(logoImg, 'PNG', 15, 8, 28, 28, undefined, 'FAST');
    } catch (e) {
        console.log("Could not load logo:", e);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(hotelName, 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(hotelAddress, 105, 28, { align: "center" });
    doc.text("Phone: " + hotelPhone + " | Email: " + hotelEmail, 105, 34, { align: "center" });

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Booking Details Report", 105, 50, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    var currentDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text("Generated on: " + currentDate, 105, 58, { align: "center" });

    doc.setFontSize(11);
    doc.text("Total Bookings: " + adminBookings.length, 20, 68);
    var totalRevenue = adminBookings.reduce(function(sum, b) { return sum + parseFloat(b.totalAmount || 0); }, 0);
    doc.text("Total Revenue: Rs." + totalRevenue.toLocaleString('en-IN'), 20, 75);

    var tableData = adminBookings.map(function(b, index) {
        return [
            index + 1,
            b.customerName || '-',
            b.customerEmail || '-',
            b.customerPhone || '-',
            formatDate(b.checkIn),
            formatDate(b.checkOut),
            b.type || '-',
            b.itemName || '-',
            b.guests || '-',
            "Rs." + parseFloat(b.totalAmount || 0).toLocaleString('en-IN')
        ];
    });

    doc.autoTable({
        startY: 82,
        head: [['#', 'Name', 'Email', 'Phone', 'Check-In', 'Check-Out', 'Type', 'Item', 'Guests', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [184, 134, 11],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 35 },
            3: { cellWidth: 22 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 12 },
            7: { cellWidth: 25 },
            8: { cellWidth: 12 },
            9: { cellWidth: 20 }
        },
        margin: { left: 10, right: 10 }
    });

    var pageCount = doc.internal.getNumberOfPages();
    
    // Add footer to each page
    for(var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text("Page " + i + " of " + pageCount, 105, 290, { align: "center" });
        doc.text("Hotel Grand Plaza - Luxury Redefined", 105, 295, { align: "center" });
    }

    doc.save("Hotel_Grand_Plaza_Customers_" + new Date().toISOString().split('T')[0] + ".pdf");
}

function toggleView(v) {
    document.getElementById("loginFields").classList.add("hidden");
    document.getElementById("resetFields").classList.add("hidden");

    if (v === "login") {
        document.getElementById("loginFields").classList.remove("hidden");
        setTimeout(() => document.getElementById("adminUser").focus(), 100);
    } 
    else if (v === "reset") {
        document.getElementById("resetFields").classList.remove("hidden");
        setTimeout(() => document.getElementById("resetUser").focus(), 100);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        showDashboard();
    } else {
        const loginUser = document.getElementById("adminUser");
        const loginPass = document.getElementById("adminPass");

        if (loginUser) {
            loginUser.focus(); 
            loginUser.addEventListener("keydown", (e) => {
                if (e.key === "Enter") { e.preventDefault(); loginPass.focus(); }
            });
        }
        if (loginPass) {
            loginPass.addEventListener("keydown", (e) => {
                if (e.key === "Enter") { e.preventDefault(); login(); }
            });
        }

        const resetUser = document.getElementById("resetUser");
        const resetPass = document.getElementById("newAdminPass");

        if (resetUser) {
            resetUser.addEventListener("keydown", (e) => {
                if (e.key === "Enter") { e.preventDefault(); resetPass.focus(); }
            });
        }
        if (resetPass) {
            resetPass.addEventListener("keydown", (e) => {
                if (e.key === "Enter") { e.preventDefault(); updatePassword(); }
            });
        }
    }
});
