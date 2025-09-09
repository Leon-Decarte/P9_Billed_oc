/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import { localStorageMock } from "../__mocks__/localStorage.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Setup: simulate a logged-in employee
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "test@email.com" }))

    // Inject the NewBill page UI
    document.body.innerHTML = NewBillUI()
  })

  describe("When I am on NewBill Page", () => {
    describe("and the page loads", () => {
      test("Then the form should render", () => {
        expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      })
    })

    describe("and the constructor runs", () => {
      test("Then it should attach event listeners to form and file input", () => {
        const form = screen.getByTestId("form-new-bill")
        const fileInput = screen.getByTestId("file")

        const formSpy = jest.spyOn(form, "addEventListener")
        const fileSpy = jest.spyOn(fileInput, "addEventListener")

        new NewBill({
          document,
          onNavigate: jest.fn(),
          store: {},
          localStorage: window.localStorage
        })

        expect(formSpy).toHaveBeenCalledWith("submit", expect.any(Function))
        expect(fileSpy).toHaveBeenCalledWith("change", expect.any(Function))
      })
    })
    describe("and I upload a file with an invalid extension", () => {
      test("handleChangeFile should show error for invalid file", () => {
        // Arrange: Render NewBill UI and instantiate NewBill
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: {},
          localStorage: window.localStorage
        })

        // Get the file input
        const fileInput = screen.getByTestId("file")

        // Create a fake invalid file (e.g., .pdf)
        const invalidFile = new File(["dummy content"], "document.pdf", { type: "application/pdf" })

        // Act: Simulate user uploading an invalid file
        fireEvent.change(fileInput, {
          target: { files: [invalidFile] }
        })

        // Assert: Error message should appear and input should be reset
        const errorMessage = document.querySelector("#file-error")
        expect(errorMessage).toBeTruthy()
        expect(errorMessage.textContent).toMatch(/Format invalide/i)
        expect(fileInput.value).toBe("") // input reset
      })

      test("Then it should reset the file input", () => {
        // ...
      })
    })

    describe("and I upload a file with a valid extension", () => {
      test("Then it should call store.create", () => {
        // ...
      })

      test("Then it should set fileUrl, fileName, and billId", () => {
        // ...
      })
    })

    describe("and store.create fails during file upload", () => {
      test("Then it should log an error in the console", () => {
        // ...
      })
    })

    describe("and I submit the form with valid data", () => {
      test("Then it should call updateBill with the right data", () => {
        // ...
      })

      test("Then it should navigate to the Bills page", () => {
        // ...
      })
    })

    describe("and store.update fails during form submission", () => {
      test("Then it should log an error in the console", () => {
        // ...
      })
    })
  })
})

