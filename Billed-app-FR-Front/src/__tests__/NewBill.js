/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"

// 🔹 Mock du store
const mockUpdate = jest.fn(() => Promise.resolve())
const mockCreate = jest.fn(() =>
  Promise.resolve({ fileUrl: "https://localhost/test.jpg", key: "1234" })
)

const storeMock = {
  bills: jest.fn(() => ({
    update: mockUpdate,
    create: mockCreate,
  })),
}

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simule un user connecté dans localStorage
    Object.defineProperty(window, "localStorage", { value: window.localStorage })
    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "employee@test.com" })
    )

    // Prépare DOM
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.innerHTML = ""
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)
  })

  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })

  describe("When I upload a valid file (jpg)", () => {
    test("It should call store.create and set fileUrl + fileName", async () => {
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: storeMock,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.jpg", { type: "image/jpg" })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => expect(mockCreate).toHaveBeenCalled())
      expect(newBill.fileUrl).toBe("https://localhost/test.jpg")
      expect(newBill.fileName).toBe("test.jpg")
    })
  })

  describe("When I upload an invalid file (pdf)", () => {
    test("It should display an error message and reset the input", () => {
      new NewBill({
        document,
        onNavigate: jest.fn(),
        store: storeMock,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["doc"], "document.pdf", { type: "application/pdf" })

      fireEvent.change(fileInput, { target: { files: [file] } })

      const errorMessage = screen.getByText(
        "Format invalide. Seuls les fichiers jpg, jpeg ou png sont acceptés."
      )
      expect(errorMessage).toBeTruthy()
      expect(fileInput.value).toBe("") // input reset
    })
  })

  describe("When I submit the form with valid data", () => {
    test("It should call updateBill and navigate to Bills", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      })

      // Mock pour éviter un vrai appel API
      newBill.updateBill = jest.fn()

      // Remplir le formulaire
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      })
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Taxi" },
      })
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "50" },
      })
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2023-08-01" },
      })
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "10" },
      })
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" },
      })
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Business trip" },
      })

      newBill.fileUrl = "https://localhost/test.jpg"
      newBill.fileName = "test.jpg"

      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

      expect(newBill.updateBill).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
    })
  })

  describe("Integration: submitting should call store.update", () => {
    test("It should call store.bills().update", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: window.localStorage,
      })

      // Remplir quelques champs obligatoires
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      })
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Uber" },
      })
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "40" },
      })
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2023-08-01" },
      })

      newBill.fileUrl = "https://localhost/test.jpg"
      newBill.fileName = "test.jpg"

      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

      await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    })
  })

  describe("When store.create fails", () => {
    test("It should log an error in console", async () => {
      const failingCreate = jest.fn(() => Promise.reject(new Error("API error")))
      const failingStore = {
        bills: jest.fn(() => ({ create: failingCreate })),
      }

      jest.spyOn(console, "error").mockImplementation(() => {})

      new NewBill({
        document,
        onNavigate: jest.fn(),
        store: failingStore,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "error.png", { type: "image/png" })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => expect(console.error).toHaveBeenCalled())

      console.error.mockRestore()
    })
  })
})
