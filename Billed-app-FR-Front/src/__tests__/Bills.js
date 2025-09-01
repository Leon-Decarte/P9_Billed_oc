/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

// ✅ mock store
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // ✅ New tests for Bills.js container
  describe("When I click on 'New Bill' button", () => {
    test("Then it should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: [] })
      const onNavigate = jest.fn()
      const billsContainer = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      const buttonNewBill = screen.getByTestId("btn-new-bill")
      fireEvent.click(buttonNewBill)
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })
  })

  describe("When I click on eye icon", () => {
    test("Then a modal should open with the bill proof image", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = jest.fn()
      const billsContainer = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

      const iconEye = screen.getAllByTestId("icon-eye")[0]
      $.fn.modal = jest.fn() // mock Bootstrap modal

      billsContainer.handleClickIconEye(iconEye)

      expect($.fn.modal).toHaveBeenCalledWith('show')
      expect(document.querySelector(".bill-proof-container img")).toBeTruthy()
    })
  })

  describe("When I call getBills", () => {
    test("Then it should return formatted bills", async () => {
      const billsContainer = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })
      const result = await billsContainer.getBills()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty("date")
      expect(result[0]).toHaveProperty("status")
    })

    test("Then it should return bills with raw date if corrupted", async () => {
      const badStore = {
        bills: () => ({
          list: () => Promise.resolve([{ id: "1", date: "not-a-date", status: "pending" }])
        })
      }
      const billsContainer = new Bills({ document, onNavigate: jest.fn(), store: badStore, localStorage: window.localStorage })
      const result = await billsContainer.getBills()
      expect(result[0].date).toBe("not-a-date") // fallback path
    })
  })
})
