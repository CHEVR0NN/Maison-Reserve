// Curated demo catalog (downsampled from a much larger real dataset) —
// every item uses generic, publicly-known liquor brand names, no hotlinked
// photography. `sku` doubles as the BottleArt seed (see components/BottleArt.jsx).
const RAW = [
  // wine-champagne
  ["W01", "Moët & Chandon Impérial Brut 750ml", "wine-champagne", 78, 92, 24, 8, 2.1, "Moët Hennessy"],
  ["W02", "Veuve Clicquot Yellow Label 750ml", "wine-champagne", 89, 105, 14, 8, 1.6, "Veuve Clicquot"],
  ["W03", "19 Crimes Cabernet Sauvignon 750ml", "wine-champagne", 29.77, 39, 0, 10, 1.5, "19 Crimes"],
  ["W04", "19 Crimes Red Blend 750ml", "wine-champagne", 29.77, 39, 32, 10, 1.1, "19 Crimes"],
  ["W05", "Jacob's Creek Shiraz Cabernet 750ml", "wine-champagne", 22.5, 28, 41, 12, 1.9, "Jacob's Creek"],
  ["W06", "Yellow Tail Chardonnay 750ml", "wine-champagne", 19.9, 24, 22, 12, 2.4, "Yellow Tail"],
  ["W07", "Dogal Grande Cuvée Lux Brut 750ml", "wine-champagne", 75, 86.9, 16, 8, 0.9, "Dogal"],
  ["W08", "Freixenet Cordon Negro Cava 750ml", "wine-champagne", 26, 32, 18, 10, 1.3, "Freixenet"],
  ["W09", "Oyster Bay Sauvignon Blanc 750ml", "wine-champagne", 24, 29, 27, 10, 1.7, "Oyster Bay"],
  ["W10", "Penfolds Koonunga Hill Shiraz 750ml", "wine-champagne", 34, 42, 14, 8, 1.2, "Penfolds"],

  // bourbon-whisky
  ["B01", "Jack Daniel's Old No.7 700ml", "bourbon-whisky", 62, 72, 22, 10, 3.1, "Brown-Forman"],
  ["B02", "Johnnie Walker Black Label 700ml", "bourbon-whisky", 68, 78, 15, 10, 2.8, "Diageo"],
  ["B03", "Wild Turkey 101 Bourbon 750ml", "bourbon-whisky", 58, 66, 0, 8, 1.4, "Wild Turkey"],
  ["B04", "Wild Turkey American Honey 750ml", "bourbon-whisky", 49, 56, 19, 8, 1.6, "Wild Turkey"],
  ["B05", "Maker's Mark Bourbon 700ml", "bourbon-whisky", 71, 80, 11, 6, 1.1, "Beam Suntory"],
  ["B06", "Chivas Regal 12yo 700ml", "bourbon-whisky", 74, 84, 9, 6, 1.5, "Chivas Brothers"],
  ["B07", "Glenfiddich 12yo Single Malt 700ml", "bourbon-whisky", 92, 105, 14, 6, 0.9, "William Grant & Sons"],
  ["B08", "Jim Beam White Label 700ml", "bourbon-whisky", 46, 52, 33, 10, 2.2, "Beam Suntory"],
  ["B09", "Macallan 12yo Double Cask 700ml", "bourbon-whisky", 148, 165, 9, 4, 0.5, "Edrington"],
  ["B10", "Suntory Toki Whisky 700ml", "bourbon-whisky", 64, 72, 12, 8, 1.3, "Suntory"],

  // gin-vodka
  ["G01", "42 Below Feijoa Vodka 700ml", "gin-vodka", 46, 52, 17, 8, 1.2, "42 Below"],
  ["G02", "Absolut Vodka 700ml", "gin-vodka", 44, 50, 28, 10, 2.3, "Pernod Ricard"],
  ["G03", "Grey Goose Vodka 700ml", "gin-vodka", 79, 88, 16, 6, 0.8, "Bacardi"],
  ["G04", "Tanqueray London Dry Gin 700ml", "gin-vodka", 58, 66, 21, 8, 1.7, "Diageo"],
  ["G05", "Hendrick's Gin 700ml", "gin-vodka", 89, 99, 13, 6, 0.6, "William Grant & Sons"],
  ["G06", "Bombay Sapphire Gin 700ml", "gin-vodka", 56, 64, 14, 8, 1.4, "Bacardi"],
  ["G07", "Ketel One Vodka 700ml", "gin-vodka", 62, 70, 9, 6, 0.9, "Diageo"],
  ["G08", "Gordon's London Dry Gin 700ml", "gin-vodka", 39, 45, 0, 10, 1.8, "Diageo"],

  // rum-tequila
  ["R01", "Bacardi Superior White Rum 700ml", "rum-tequila", 42, 48, 26, 10, 2.0, "Bacardi"],
  ["R02", "Captain Morgan Spiced Gold 700ml", "rum-tequila", 45, 51, 18, 8, 1.6, "Diageo"],
  ["R03", "Jose Cuervo Especial Silver 700ml", "rum-tequila", 49, 56, 12, 8, 1.3, "Jose Cuervo"],
  ["R04", "Patrón Silver Tequila 750ml", "rum-tequila", 98, 110, 11, 4, 0.5, "Bacardi"],
  ["R05", "Havana Club 7 Años 700ml", "rum-tequila", 58, 65, 7, 6, 0.9, "Pernod Ricard"],
  ["R06", "El Jimador Blanco Tequila 750ml", "rum-tequila", 52, 59, 0, 6, 0.7, "Brown-Forman"],

  // brandy-cognac
  ["C01", "Hennessy VSOP 700ml", "brandy-cognac", 118, 132, 9, 6, 1.1, "Moët Hennessy"],
  ["C02", "Martell VSOP 700ml", "brandy-cognac", 112, 126, 14, 6, 0.9, "Pernod Ricard"],
  ["C03", "Martell XO 700ml", "brandy-cognac", 268, 295, 7, 3, 0.3, "Pernod Ricard"],
  ["C04", "Rémy Martin VSOP 700ml", "brandy-cognac", 115, 129, 11, 4, 0.6, "Rémy Cointreau"],
  ["C05", "Courvoisier VS 700ml", "brandy-cognac", 88, 98, 11, 6, 0.8, "Beam Suntory"],

  // beer-cider
  ["E01", "Erdinger Weissbier 12x500ml", "beer-cider", 58, 68, 22, 10, 2.6, "Erdinger"],
  ["E02", "Curmi 750ml", "beer-cider", 12.5, 15, 34, 12, 3.0, "Curmi"],
  ["E03", "Nebra 750ml", "beer-cider", 14, 17, 19, 10, 1.8, "Nebra"],
  ["E04", "Oppale Craft Ale 500ml", "beer-cider", 9.5, 11.5, 41, 15, 2.9, "Oppale"],
  ["E05", "Tredue Pilsner 500ml", "beer-cider", 7.8, 9.5, 24, 15, 1.5, "Tredue"],
  ["E06", "Heineken Lager 24x330ml", "beer-cider", 52, 60, 15, 10, 3.4, "Heineken"],
  ["E07", "Somersby Apple Cider 24x330ml", "beer-cider", 48, 55, 19, 10, 1.9, "Carlsberg"],

  // liqueur
  ["L01", "Baileys Irish Cream 700ml", "liqueur", 44, 50, 17, 8, 1.7, "Diageo"],
  ["L02", "Cointreau Triple Sec 700ml", "liqueur", 62, 70, 15, 6, 0.9, "Rémy Cointreau"],
  ["L03", "Kahlúa Coffee Liqueur 700ml", "liqueur", 47, 53, 13, 6, 1.0, "Pernod Ricard"],
  ["L04", "Disaronno Amaretto 700ml", "liqueur", 55, 62, 14, 6, 0.7, "Illva Saronno"],
  ["L05", "Jägermeister 700ml", "liqueur", 49, 56, 24, 10, 2.1, "Mast-Jägermeister"],

  // mixers
  ["M01", "Fever-Tree Indian Tonic 4x200ml", "mixers", 8.9, 10.5, 62, 20, 3.8, "Fever-Tree"],
  ["M02", "Schweppes Soda Water 6x300ml", "mixers", 6.5, 7.8, 55, 20, 3.2, "Schweppes"],
  ["M03", "Coca-Cola Mixer 6x300ml", "mixers", 6.2, 7.5, 48, 20, 3.0, "Coca-Cola"],
];

export const INVENTORY = RAW.map(([sku, name, category, price, originalPrice, stock, minStock, velocity, supplier]) => ({
  id: sku,
  sku,
  name,
  category,
  price,
  originalPrice,
  stock,
  minStock,
  velocity,
  supplier,
}));
