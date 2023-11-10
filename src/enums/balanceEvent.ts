/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

export enum BalanceEvent {
    Deposit = "deposit",
    Invoice = "invoice",
    OpenInvoice = "open_invoice",
    PreviousBalance = "previous_balance",
    Tip = "tip",
    UndoInvoice = "undo_invoice",
    UndoTip = "undo_tip",
    Withdraw = "withdraw"
}