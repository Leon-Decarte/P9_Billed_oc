import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
    constructor({ document, onNavigate, store, localStorage }) {
        // Dependencies injected into the class:
        // - document: the DOM, where we query and attach listeners
        // - onNavigate: a function that allows navigation between pages
        // - store: an object that simulates API calls (CRUD on bills)
        // - localStorage: access to current user data (email, etc.)
        this.document = document
        this.onNavigate = onNavigate
        this.store = store

        // Select the form from the DOM and listen for submit events
        const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
        formNewBill.addEventListener("submit", this.handleSubmit)

        // Select the file input and listen for file selection events
        const file = this.document.querySelector(`input[data-testid="file"]`)
        file.addEventListener("change", this.handleChangeFile)

        // Variables to store data once the file is uploaded
        this.fileUrl = null   // The URL returned by the backend for the uploaded file
        this.fileName = null  // The name of the file (string, ex: "invoice.png")
        this.billId = null    // The unique ID of the bill returned by backend

        // Handles logout logic when clicking on "logout"
        new Logout({ document, localStorage, onNavigate })
    }

    // === Handle when the user uploads a file ===
    handleChangeFile = e => {
        e.preventDefault()

        // Grab the file input and the file selected
        const fileInput = this.document.querySelector(`input[data-testid="file"]`)
        const file = fileInput.files[0] // First selected file
        const fileName = file.name      // Name of the file, like "photo.png"

        // Check allowed file extensions
        const validExtensions = ["jpg", "jpeg", "png"]
        const fileExtension = fileName.split(".").pop().toLowerCase()

        // If an error message already exists in DOM, remove it
        let errorMessage = this.document.querySelector("#file-error")
        if (errorMessage) errorMessage.remove()

        // If the file type is invalid → show error, reset input, and stop
        if (!validExtensions.includes(fileExtension)) {
            errorMessage = document.createElement("p")
            errorMessage.id = "file-error"
            errorMessage.style.color = "red"
            errorMessage.innerText = "Format invalide. Seuls les fichiers jpg, jpeg ou png sont acceptés."
            fileInput.insertAdjacentElement("afterend", errorMessage)

            fileInput.value = "" // Reset input
            return
        }

        // Otherwise, valid file → prepare data to send to backend
        const formData = new FormData() // Built-in JS object to send files in HTTP requests
        const email = JSON.parse(localStorage.getItem("user")).email // Retrieve user email from storage
        formData.append('file', file)   // Attach file to payload
        formData.append('email', email) // Attach email to payload

        // Call backend through store → simulate uploading file
        this.store
            .bills()
            .create({
                data: formData,
                headers: { noContentType: true } // important: FormData handles its own content-type
            })
            .then(({ fileUrl, key }) => {
                // Once API responds, store the returned data locally
                this.billId = key
                this.fileUrl = fileUrl
                this.fileName = fileName
            })
            .catch(error => console.error(error))
    }

    // === Handle when the user submits the form ===
    handleSubmit = e => {
        e.preventDefault()

        // Construct the bill object with all form fields
        const email = JSON.parse(localStorage.getItem("user")).email
        const bill = {
            email,
            type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
            name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
            amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
            date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
            vat: e.target.querySelector(`input[data-testid="vat"]`).value,
            pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
            commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
            fileUrl: this.fileUrl,   // ← previously set in handleChangeFile
            fileName: this.fileName, // ← previously set in handleChangeFile
            status: 'pending'
        }

        // Update the backend with the bill object
        this.updateBill(bill)

        // Navigate back to Bills page
        this.onNavigate(ROUTES_PATH['Bills'])
    }

    // === Calls backend to update the bill in database ===
    updateBill = (bill) => {
        if (this.store) {
            this.store
                .bills()
                .update({ data: JSON.stringify(bill), selector: this.billId })
                .then(() => {
                    this.onNavigate(ROUTES_PATH['Bills'])
                })
                .catch(error => console.error(error))
        }
    }
}
