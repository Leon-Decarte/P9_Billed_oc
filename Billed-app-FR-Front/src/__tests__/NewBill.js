/**
 * @jest-environment jsdom
 */
import userEvent from "@testing-library/user-event"
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

// Mock the store globally → avoids real backend requests
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
    beforeEach(() => {
        // Simulate an employee logged in
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem(
            "user",
            JSON.stringify({ type: "Employee", email: "employee@test.tld" })
        )

        // Add root container for router
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.innerHTML = ""
        document.body.append(root)
        router()
    })

    // ---------------------------
    // NAVIGATION TESTS
    // ---------------------------
    describe("When I navigate to NewBill Page", () => {
        beforeEach(() => {
            window.onNavigate(ROUTES_PATH.NewBill)
        })

        test("Then the NewBill form should be displayed", () => {
            expect(screen.getByTestId("form-new-bill")).toBeTruthy()
        })

        test("Then the bill icon should be highlighted", async () => {
            await waitFor(() => screen.getByTestId("icon-mail"))
            const mailIcon = screen.getByTestId("icon-mail")
            expect(mailIcon.classList.contains("active-icon")).toBe(true)
        })
    })

    // ---------------------------
    // FILE UPLOAD TESTS
    // ---------------------------
    describe("When I add a new proof file", () => {
        beforeEach(() => {
            window.onNavigate(ROUTES_PATH.NewBill)
        })

        test("Then the file should be rejected if its type is not jpg, jpeg or png", () => {
            const newBill = new NewBill({
                document,
                onNavigate,
                localStorage: window.localStorage,
            })

            // Spy on the handler
            const handleChangeFile = jest.fn(newBill.handleChangeFile)
            const fileInput = screen.getByTestId("file")
            fileInput.addEventListener("change", handleChangeFile)

            // Simulate uploading an invalid file
            const invalidFile = new File(["dummy"], "test.svg", { type: "image/svg" })
            fireEvent.change(fileInput, { target: { files: [invalidFile] } })

            // Expect reset and handler called
            expect(fileInput.value).toBe("")
            expect(handleChangeFile).toHaveBeenCalled()
        })

        test("Then the file should be accepted if its type is jpg, jpeg or png", async () => {
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            })

            // Spy on store.create
            const createSpy = jest
                .spyOn(newBill.store.bills(), "create")
                .mockResolvedValue({
                    fileUrl: "https://example.com/test.jpg",
                    key: "1234",
                })

            const fileInput = screen.getByTestId("file")
            const validFile = new File(["test"], "test.png", { type: "image/png" })

            // Simulate uploading a valid file
            fireEvent.change(fileInput, { target: { files: [validFile] } })

            // Wait for promises to resolve
            await waitFor(() => {
                expect(createSpy).toHaveBeenCalled()
                expect(newBill.fileName).toBe("test.png")
                expect(newBill.fileUrl).toBe("https://example.com/test.jpg")
                expect(newBill.billId).toBe("1234")
            })
        })
    })

    // ---------------------------
    // FORM SUBMISSION TEST
    // ---------------------------
    describe("When I complete the form and submit it", () => {
        beforeEach(() => {
            window.onNavigate(ROUTES_PATH.NewBill)
        })

        test("Then it should call handleSubmit and redirect to Bills page", async () => {
            const mockOnNavigate = jest.fn()
            const newBill = new NewBill({
                document,
                onNavigate: mockOnNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            })

            const form = screen.getByTestId("form-new-bill")
            const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
            form.addEventListener("submit", handleSubmit)

            // Fill all required fields
            screen.getByTestId("expense-type").value = "Services en ligne"
            screen.getByTestId("expense-name").value = "Test service"
            screen.getByTestId("datepicker").value = "2023-05-01"
            screen.getByTestId("amount").value = 120
            screen.getByTestId("vat").value = 20
            screen.getByTestId("pct").value = 10
            screen.getByTestId("commentary").value = "Test commentary"

            // Upload valid file
            const file = new File(["test"], "test.png", { type: "image/png" })
            const fileInput = screen.getByTestId("file")
            userEvent.upload(fileInput, file)

            // Submit form
            fireEvent.submit(form)

            // Expectations
            expect(handleSubmit).toHaveBeenCalled()
            expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
        })
    })
})
