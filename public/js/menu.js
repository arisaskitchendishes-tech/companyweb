// Menu, events and merch data. Edit prices/items here.
// Admin can mark items "sold out" live from the dashboard.

export const CATEGORIES = [
  { id: "signature", label: "Signature", icon: "🔥" },
  { id: "grill",     label: "Grilled",   icon: "🍗" },
  { id: "kenyan",    label: "Kenyan",    icon: "🍛" },
  { id: "intl",      label: "International", icon: "🍝" },
  { id: "burgers",   label: "Burgers & Snacks", icon: "🍔" },
  { id: "drinks",    label: "Juices & Drinks", icon: "🥤" },
  { id: "desserts",  label: "Desserts",  icon: "🍰" },
  { id: "merch",     label: "Merch",     icon: "🛍️" }
];

const IMG = {
  plate: "assets/plate.jpg",
  grill: "assets/dish-grilled-chicken.jpg",
  kenyan: "assets/dish-kenyan.jpg",
  intl: "assets/dish-international.jpg",
  burgers: "assets/dish-burgers.jpg",
  drinks: "assets/dish-juices.jpg",
  desserts: "assets/dish-desserts.jpg"
};

const SPICE = { name: "Spice level", type: "one", choices: ["Mild", "Medium", "Hot 🔥"] };
const SIDES = { name: "Choose a side", type: "one", choices: ["Pilau", "Fries", "Ugali", "Coconut rice"] };
const EXTRAS = { name: "Add extras", type: "many", choices: [["Kachumbari", 80], ["Extra sauce", 50], ["Avocado", 100]] };

export const MENU = [
  // Signature
  { id: "sig-grill-platter", cat: "signature", name: "Arisa's Fire-Grilled Chicken", price: 1150, img: IMG.plate,
    desc: "Our famous herb-marinated quarter chicken, flame-grilled and served with garden salad and pilau.",
    tags: ["Chef's pick", "Best seller"], options: [SPICE, SIDES, EXTRAS], signature: true },
  { id: "sig-nyama", cat: "signature", name: "Nyama Choma Feast", price: 1450, img: IMG.kenyan,
    desc: "Slow-roasted goat, kachumbari and ugali — made for sharing.", tags: ["Serves 2"], options: [SPICE, EXTRAS], signature: true },
  { id: "sig-pasta", cat: "signature", name: "Spicy Prawn Linguine", price: 1250, img: IMG.intl,
    desc: "Garlic-chilli prawns tossed in fresh tomato sauce and basil.", tags: ["New"], options: [SPICE], signature: true },
  { id: "sig-burger", cat: "signature", name: "The Great Mood Burger", price: 950, img: IMG.burgers,
    desc: "Double beef patty, cheddar, caramelised onions, house sauce, toasted brioche.", tags: ["Best seller"], options: [SIDES, EXTRAS], signature: true },

  // Grilled
  { id: "gr-quarter", cat: "grill", name: "Quarter Grilled Chicken", price: 750, img: IMG.grill, desc: "Smoky, juicy, with a side of your choice.", options: [SPICE, SIDES] },
  { id: "gr-half", cat: "grill", name: "Half Grilled Chicken", price: 1200, img: IMG.grill, desc: "Half bird, peri-peri or lemon-herb.", options: [SPICE, SIDES, EXTRAS] },
  { id: "gr-wings", cat: "grill", name: "Sticky Honey Wings (8)", price: 850, img: IMG.grill, desc: "Honey-chilli glaze, sesame, spring onion.", options: [SPICE] },
  { id: "gr-skewers", cat: "grill", name: "Beef Mishkaki Skewers", price: 900, img: IMG.grill, desc: "Coast-style marinated beef skewers.", options: [SPICE, SIDES] },

  // Kenyan
  { id: "ke-pilau", cat: "kenyan", name: "Beef Pilau", price: 650, img: IMG.kenyan, desc: "Fragrant spiced rice with tender beef and kachumbari." },
  { id: "ke-stew", cat: "kenyan", name: "Beef Stew & Chapati", price: 700, img: IMG.kenyan, desc: "Rich tomato beef stew with 2 soft chapatis." },
  { id: "ke-fish", cat: "kenyan", name: "Whole Tilapia Fry", price: 1300, img: IMG.kenyan, desc: "Lake-fresh tilapia with ugali and sukuma.", options: [SPICE] },
  { id: "ke-githeri", cat: "kenyan", name: "Githeri Special", price: 450, img: IMG.kenyan, desc: "Maize & beans slow-cooked with veggies." },

  // International
  { id: "in-alfredo", cat: "intl", name: "Chicken Alfredo", price: 1050, img: IMG.intl, desc: "Creamy parmesan sauce, grilled chicken, fettuccine." },
  { id: "in-bolognese", cat: "intl", name: "Beef Bolognese", price: 950, img: IMG.intl, desc: "Slow-simmered beef ragù over spaghetti." },
  { id: "in-stirfry", cat: "intl", name: "Veggie Stir-fry Noodles", price: 800, img: IMG.intl, desc: "Wok-tossed seasonal vegetables, soy & ginger.", tags: ["Vegetarian"] },

  // Burgers & snacks
  { id: "bg-classic", cat: "burgers", name: "Classic Beef Burger", price: 750, img: IMG.burgers, desc: "Beef patty, lettuce, tomato, house sauce.", options: [SIDES] },
  { id: "bg-chicken", cat: "burgers", name: "Crispy Chicken Burger", price: 800, img: IMG.burgers, desc: "Buttermilk fried chicken, slaw, chilli mayo.", options: [SPICE, SIDES] },
  { id: "bg-fries", cat: "burgers", name: "Masala Fries", price: 400, img: IMG.burgers, desc: "Crispy fries tossed in tangy masala.", options: [SPICE] },
  { id: "bg-samosa", cat: "burgers", name: "Beef Samosas (3)", price: 300, img: IMG.burgers, desc: "Golden, crispy and generously filled." },

  // Drinks
  { id: "dr-passion", cat: "drinks", name: "Fresh Passion Juice", price: 300, img: IMG.drinks, desc: "Squeezed fresh daily." },
  { id: "dr-mango", cat: "drinks", name: "Mango Smoothie", price: 380, img: IMG.drinks, desc: "Thick, cold and naturally sweet." },
  { id: "dr-dawa", cat: "drinks", name: "Dawa (Honey-Lemon-Ginger)", price: 280, img: IMG.drinks, desc: "Warm or iced — the Kenyan classic." },
  { id: "dr-tea", cat: "drinks", name: "Masala Chai", price: 180, img: IMG.drinks, desc: "Spiced milky tea." },

  // Desserts
  { id: "ds-cheesecake", cat: "desserts", name: "Chocolate Berry Cheesecake", price: 550, img: IMG.desserts, desc: "Creamy cheesecake, chocolate drizzle, fresh strawberry." },
  { id: "ds-mandazi", cat: "desserts", name: "Mandazi & Chocolate Dip", price: 350, img: IMG.desserts, desc: "Warm coconut mandazi with dipping chocolate." },
  { id: "ds-sundae", cat: "desserts", name: "Mango Sundae", price: 420, img: IMG.desserts, desc: "Vanilla ice cream, mango coulis, crunchy nuts." }
];

export const MERCH = [
  { id: "mc-bundle", cat: "merch", name: "Great Mood Merch Bundle", price: 6500, img: "assets/merch-set.webp", pos: "50% 50%", tags: ["Save 15%"],
    desc: "Polo, apron, cap, mug, bottle & tote, the full set in one bag.", options: [{ name: "Polo size", type: "one", choices: ["S", "M", "L", "XL", "XXL"] }] },
  { id: "mc-polo", cat: "merch", name: "Sunshine Polo Shirt", price: 1800, img: "assets/merch-polo.jpg", pos: "45% 50%",
    desc: "Yellow piqué polo with brown collar and embroidered logo.", options: [{ name: "Size", type: "one", choices: ["S", "M", "L", "XL", "XXL"] }] },
  { id: "mc-apron", cat: "merch", name: "Signature Chef Apron", price: 1500, img: "assets/merch-apron.jpg", pos: "50% 50%",
    desc: "Chocolate-brown apron, yellow trim, big front pocket." },
  { id: "mc-jacket", cat: "merch", name: "Chef Jacket", price: 3200, img: "assets/merch-jacket.jpg", pos: "40% 30%",
    desc: "White double-breasted jacket with brown piping.", options: [{ name: "Size", type: "one", choices: ["S", "M", "L", "XL"] }] },
  { id: "mc-cap", cat: "merch", name: "Arisa's Cap", price: 900, img: "assets/merch-cap.jpg", pos: "50% 50%",
    desc: "Brown cap with yellow piping and embroidered logo." },
  { id: "mc-mug", cat: "merch", name: "Great Mood Mug", price: 650, img: "assets/merch-mug.jpg", pos: "45% 55%",
    desc: "Ceramic mug with a sunshine-yellow inside." },
  { id: "mc-bottle", cat: "merch", name: "Sports Water Bottle", price: 850, img: "assets/merch-bottle.jpg", pos: "50% 50%",
    desc: "Leak-proof flip cap, 750 ml." },
  { id: "mc-tote", cat: "merch", name: "Canvas Tote Bag", price: 750, img: "assets/merch-tote.jpg", pos: "50% 65%",
    desc: "Sturdy canvas with yellow handles. Reuse it everywhere." }
];

export const PACKAGING = [
  { e: "🛍️", title: "Sunshine Carry Bag", note: "Recyclable paper, strong rope handles" },
  { e: "☕", title: "Hot Cup", note: "Double-wall, spill-safe lid" },
  { e: "🍔", title: "Burger Box", note: "Vented so buns stay soft, not soggy" },
  { e: "🍟", title: "Fry Sleeve", note: "Fold-flat red sleeve, crisp to the last fry" },
  { e: "🥤", title: "Juice Cup", note: "Dome lid & straw, keeps it cold" },
  { e: "🥗", title: "Kraft Salad Bowl", note: "Compostable, sealed for delivery" }
];

// Upcoming events — dates are generated relative to today so the demo always looks fresh.
function nextDow(dow, addWeeks = 0) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff + addWeeks * 7);
  return d;
}
export const EVENTS = [
  { id: "ev-live", title: "Live Music Fridays", date: nextDow(5), time: "19:00", price: 0, img: "assets/chef-studio.jpg",
    blurb: "Acoustic sets, grill specials and great mood till late.", tag: "Free entry" },
  { id: "ev-choma", title: "Sunday Nyama Choma Brunch", date: nextDow(0), time: "11:00", price: 1800, img: "assets/dish-kenyan.jpg",
    blurb: "Bottomless juices and a choma spread for the whole family.", tag: "Per person" },
  { id: "ev-class", title: "Cook with Arisa: Pilau Masterclass", date: nextDow(6, 1), time: "14:00", price: 2500, img: "assets/chef-arisa.jpg",
    blurb: "Hands-on class — you cook, you eat, you take the recipe home.", tag: "12 spots" }
];

export const BOOKING_TYPES = [
  { id: "table", label: "Table", icon: "🍽️", hint: "Dine in with us" },
  { id: "birthday", label: "Birthday", icon: "🎂", hint: "Cake, deco & a song" },
  { id: "corporate", label: "Corporate", icon: "💼", hint: "Meetings & team lunches" },
  { id: "catering", label: "Catering", icon: "🚚", hint: "Weddings & events at your venue" },
  { id: "chef", label: "Private Chef", icon: "👨‍🍳", hint: "We cook at your home" }
];

export const PACKAGES = [
  { id: "classic", label: "Classic", pp: 1200, items: "2 mains, 1 side, juice" },
  { id: "premium", label: "Premium", pp: 2000, items: "3 mains, 2 sides, dessert, juice bar" },
  { id: "signature", label: "Signature", pp: 3200, items: "Full buffet, live grill station, desserts, drinks" }
];

export const TIME_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
