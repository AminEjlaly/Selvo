import { StyleSheet } from "react-native";

const defaultFont = { fontFamily: "IRANYekan" };

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ebedf0ff",
    padding: 16,
    direction: "rtl",
    ...defaultFont
  },
  
  main: {
    ...defaultFont,
    backgroundColor: "transparent",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  cover: {
    marginBottom: 5,
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#ffffffff",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 1,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  
  card: {
    direction: "rtl",
    gap: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
  },

  productImage: {
    alignContent: "left",
    alignItems: "left",
    justifyContent: "flex-end",
    width: 110,
    height: 110,
    marginRight: 12,
    borderRadius: 12,
    resizeMode: "contain",
    backgroundColor: "#f8fafc",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  info: {
    flex: 1,
    flexWrap: "wrap",
    flexShrink: 1,
    alignItems: "flex-start",
    textAlign: "right",
    direction: "rtl",
  },

  name: {
    ...defaultFont,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 6,
    color: "#1e293b",
  },
  
  text: {
    ...defaultFont,
    fontSize: 12,
    color: "#64748b",
    textAlign: "left",
    marginBottom: 4,
    marginTop: 10,
  },
  
  price: {
    ...defaultFont,
    fontWeight: "bold",
    color: "#0622a3",
    fontSize: 15,
    marginTop: 4,
  },

  GroupButtons: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
  },

  totalContainer: {
    
    direction:"rtl",
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 10,
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems:"flex-start"
  },
  
  totalText: {
    ...defaultFont,
    
    fontSize: 18,
    textAlign: "right",
    color: "#0622a3",
  },

  AddBtn: {
    ...defaultFont,
    padding: 8,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    width: "45%",
    alignSelf: "center",
    borderRadius: 8,
  },

  CustomerBtn: {
    ...defaultFont,
    padding: 8,
    backgroundColor: "#0d3ec4ff",
    flexDirection: "row",
    width: "45%",
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 10,
    justifyContent: "center",
  },

  GroupbuttonTop: {
    width: "100%",
    flexDirection: "row",
    margin: "auto",
    gap: 10,
    justifyContent: "center",
  },

  clearBtn: {
    backgroundColor: "#0622a3",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  
  clearBtnText: {
    ...defaultFont,
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },

  modalContainer: {
    
    flex: 1,
    ...defaultFont,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  
  modalContent: {
    ...defaultFont,
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    elevation: 25,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  
  input: {
    ...defaultFont,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    textAlign: "right",
    backgroundColor: "#ffffff",
    fontSize: 15,
    color: "#1e293b",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  
  customerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 4,
  },
  
  customerName: {
    ...defaultFont,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1e293b",
  },
  
  customerPhone: {
    ...defaultFont,
    fontSize: 14,
    color: "#64748b",
    textAlign: "right",
  },
  
  modalButton: {
    backgroundColor: "#0622a3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  
  modalButtonText: {
    ...defaultFont,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  
  emptyCartText: {
    ...defaultFont,
    fontSize: 17,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
  },
  
  continueShoppingBtn: {
    backgroundColor: "#0622a3",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  
  continueShoppingText: {
    ...defaultFont,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  
  productRowDisabled: {
    opacity: 0.6,
    backgroundColor: "#f8fafc",
  },
  

  productInfo: {
    ...defaultFont,
    gap: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  
  productTitr: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
    productRowKala: {
    direction: "rtl",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: {
      width: 10,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  
  productTitle: {
    flexDirection: "row",
    width: "90%",
    flexWrap: "wrap",
    flexShrink: 1,
    direction: "rtl",
    alignItems: "flex-start"
  },

  productName: {
    ...defaultFont,
    marginRight: 5,
    fontWeight: "900",
    color: "#1e293b",
    fontSize: 14,
  },


  productCode: {
    ...defaultFont,
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    textAlign: "right",
  },
  
  productDetails: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  
  productPrice: {
    ...defaultFont,
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  
  productStock: {
    ...defaultFont,
    fontSize: 13,
    fontWeight: "500",
    color: "#1e293b",
  },
  
  productUnit: {
  ...defaultFont,
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    textAlign: "right",
  },
  
  addProductButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  
  addProductButtonText: {
    ...defaultFont,
    color: "#1521c9ff",
    fontSize: 20,
    fontWeight: "bold",
  },
});