// Shared identities referenced by orders, delivery, loyalty and inbox mocks —
// keeping one list means the same customer name shows up consistently
// across pages instead of every domain inventing its own cast.

export const DRIVERS = [
  { id: "driver_1", name: "Rafael Cruz", truckId: "truck_1", phone: "+65 8123 4501" },
  { id: "driver_2", name: "Amrita Singh", truckId: "truck_2", phone: "+65 8123 4502" },
];

export const STOCK_CLERK = { id: "clerk_1", name: "Priya Nathan", role: "Stock Receiving" };

export const CUSTOMERS = [
  { name: "Marcus Tan",        phone: "+65 9123 4001", postal: "018956", address: "1 Fullerton Rd" },
  { name: "Wei Ling Koh",      phone: "+65 9123 4002", postal: "238859", address: "313 Orchard Rd" },
  { name: "Daniel Foo",        phone: "+65 9123 4003", postal: "049483", address: "6 Raffles Blvd" },
  { name: "Amanda Ong",        phone: "+65 9123 4004", postal: "228208", address: "8 Grange Rd" },
  { name: "Ryan Lim",          phone: "+65 9123 4005", postal: "168732", address: "112 Tanjong Pagar Rd" },
  { name: "Sarah Teo",         phone: "+65 9123 4006", postal: "119613", address: "21 Holland Village Way" },
  { name: "Jonathan Ng",       phone: "+65 9123 4007", postal: "520123", address: "123 Tampines St 11" },
  { name: "Priscilla Chua",    phone: "+65 9123 4008", postal: "560456", address: "456 Ang Mo Kio Ave 3" },
  { name: "Kevin Goh",         phone: "+65 9123 4009", postal: "730123", address: "12 Woodlands Dr 14" },
  { name: "Michelle Lee",      phone: "+65 9123 4010", postal: "545078", address: "78 Serangoon Ave 3" },
  { name: "Timothy Yeo",       phone: "+65 9123 4011", postal: "678910", address: "9 Bukit Panjang Ring Rd" },
  { name: "Natalie Wong",      phone: "+65 9123 4012", postal: "319762", address: "2 Balestier Rd" },
  { name: "Bryan Chan",        phone: "+65 9123 4013", postal: "199589", address: "1 Beach Rd" },
  { name: "Clara Sim",         phone: "+65 9123 4014", postal: "409051", address: "10 Eunos Rd 8" },
  { name: "Gerald Toh",        phone: "+65 9123 4015", postal: "760543", address: "5 Yishun Ave 9" },
  { name: "Vanessa Ho",        phone: "+65 9123 4016", postal: "279623", address: "3 Bukit Timah Rd" },
  { name: "Hafiz Rahman",      phone: "+65 9123 4017", postal: "649123", address: "20 Jurong East St 13" },
  { name: "Cheryl Tan",        phone: "+65 9123 4018", postal: "556741", address: "6 Hougang Ave 8" },
  { name: "Ivan Lau",          phone: "+65 9123 4019", postal: "570123", address: "88 Ang Mo Kio Ave 6" },
  { name: "Fiona Neo",         phone: "+65 9123 4020", postal: "138675", address: "31 Clementi Rd" },
];
