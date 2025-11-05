/**
 * MorningEventsScreenModel - Encapsulates shop pricing and simple rules
 */
export class MorningEventsScreenModel {
    private cropBuyCost = 10;
    private cropSellPrice = 5;

    getCropBuyCost(): number { return this.cropBuyCost; }
    getCropSellPrice(): number { return this.cropSellPrice; }
}

