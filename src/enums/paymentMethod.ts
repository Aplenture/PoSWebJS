/**
 * Aplenture/PoSWebJS
 * https://github.com/Aplenture/PoSWebJS
 * Copyright (c) 2023 Aplenture
 * License https://github.com/Aplenture/PoSWebJS/blob/main/LICENSE
 */

export enum PaymentMethod {
    None = 0,
    Balance = 1 << 0,
    Cash = 1 << 1
}