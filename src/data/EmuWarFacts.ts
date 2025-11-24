/**
 * Historical facts about the Great Emu War (1932)
 */
export interface EmuWarFact {
	id: string;
	title: string;
	description: string;
	category: "historical" | "military" | "ecological" | "outcome";
}

export const EMU_WAR_FACTS: EmuWarFact[] = [
	{
		id: "emu-war-1",
		title: "The Great Emu War",
		description: "In 1932, Australian farmers in Western Australia faced massive emu invasions destroying wheat crops. The government deployed military forces to cull the emus.",
		category: "historical",
	},
	{
		id: "emu-war-2",
		title: "Military Deployment",
		description: "Major G.P.W. Meredith of the Royal Australian Artillery led the operation using Lewis machine guns mounted on trucks.",
		category: "military",
	},
	{
		id: "emu-war-3",
		title: "Emu Behavior",
		description: "Emus proved surprisingly resilient and difficult to hit. They scattered quickly when fired upon and could run up to 50 km/h.",
		category: "ecological",
	},
	{
		id: "emu-war-4",
		title: "Operation Outcome",
		description: "The military operation was largely unsuccessful. After weeks of effort, only a small fraction of the estimated 20,000 emus were killed.",
		category: "outcome",
	},
	{
		id: "emu-war-5",
		title: "Barbed Wire",
		description: "Barbed wire was used extensively in WWI and adapted for agricultural use. Farmers tried various barriers to protect crops from emus.",
		category: "military",
	},
	{
		id: "emu-war-6",
		title: "Sandbag Fortifications",
		description: "Sandbags were a common military fortification technique. In the emu war, farmers used similar barriers to protect their fields.",
		category: "military",
	},
	{
		id: "emu-war-7",
		title: "Crop Destruction",
		description: "Emus destroyed thousands of acres of wheat crops, causing significant economic damage to Australian farmers during the Great Depression.",
		category: "ecological",
	},
	{
		id: "emu-war-8",
		title: "Public Reaction",
		description: "The operation received widespread media attention and became a symbol of the challenges of wildlife management.",
		category: "outcome",
	},
];

export function getFactByDefenseType(defenseType: string): EmuWarFact | null {
	switch (defenseType) {
		case "barbed_wire":
			return EMU_WAR_FACTS.find(f => f.id === "emu-war-5") || null;
		case "sandbag":
			return EMU_WAR_FACTS.find(f => f.id === "emu-war-6") || null;
		case "machine_gun":
			return EMU_WAR_FACTS.find(f => f.id === "emu-war-2") || null;
		case "mine":
			return EMU_WAR_FACTS.find(f => f.id === "emu-war-4") || null;
		default:
			return null;
	}
}

export function getRandomFact(): EmuWarFact {
	return EMU_WAR_FACTS[Math.floor(Math.random() * EMU_WAR_FACTS.length)];
}

