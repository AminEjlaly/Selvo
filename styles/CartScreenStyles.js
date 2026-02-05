import { StyleSheet } from "react-native";

const defaultFont = { fontFamily: "IRANYekan" };

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfbff",
    padding: 8,
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
    textAlign: "left",
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
    position: "absolute",
    bottom: 70,
    left: 0,
    marginBottom: 15,
    alignItems:"center",
    right: 0,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
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
  },
  
  totalText: {
    
    fontFamily: "IRANYekan",
    fontSize: 18,
    textAlign: "right",
    color: "#0622a3",
  },

  clearBtn: {
    backgroundColor: "#0622a3",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 25,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
   clearBtn1: {
    backgroundColor: "#0622a3",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 28,
    marginTop:55,
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
    
    color: "#ffffff",
    fontFamily: "IRANYekan",
    fontSize: 16,
  },

  modalContainerBackgroundKala: {
    direction: "rtl",
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  
  modalContentKala: {
    display: "flex",
    flexDirection: "column",
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

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  
  modalContent: {
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
    
    fontSize: 16,
   fontFamily: "IRANYekan-Bold",
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
    
    fontSize: 16,
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
    fontFamily: "IRANYekan-Bold",
    justifyContent: "space-between",
  },
  
  productTitle: {
    flexDirection: "row",
    width: "90%",
    flexWrap: "wrap",
    flexShrink: 1,
    direction: "rtl",
    alignItems: "flex-start",
    fontFamily: "IRANYekan-Bold",
  },

  productName: {
   
    marginRight: 5,
   fontFamily: "IRANYekan-Bold",
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
    fontSize: 15,
    color: "#059669",
    fontFamily: "IRANYekan",
  },
  
  productStock: {
    
    fontSize: 13,
    fontFamily: "IRANYekan",
    color: "#1e293b",
  },
  
  productUnit: {
    
    fontSize: 12,
    color: "#64748b",
    
    textAlign: "right",
    fontFamily: "IRANYekan",
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
  // اضافه کن به src/styles/ChatScreen.styles.js

// این استایل‌ها رو به فایل موجود اضافه کن:

uploadIndicator: {
  position: 'absolute',
  bottom: 80,
  left: 20,
  right: 20,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderRadius: 12,
  padding: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  zIndex: 100,
},

uploadIndicatorText: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '500',
},

progressContainer: {
  marginTop: 8,
  width: '100%',
},

progressBar: {
  height: 4,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: 2,
  overflow: 'hidden',
  marginBottom: 4,
},

progressFill: {
  height: '100%',
  backgroundColor: '#0088cc',
  borderRadius: 2,
},

progressText: {
  fontSize: 10,
  color: '#6b7280',
  textAlign: 'right',
},

fileMessage: {
  padding: 0,
},

attachButtonDisabled: {
  opacity: 0.5,
},

refreshButton: {
  marginLeft: 8,
  padding: 4,
},

refreshButtonText: {
  fontSize: 16,
},

imagePreviewOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  justifyContent: 'center',
  alignItems: 'center',
},

imagePreviewClose: {
  position: 'absolute',
  top: 50,
  right: 20,
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
},

imagePreviewCloseText: {
  color: '#ffffff',
  fontSize: 24,
  fontWeight: 'bold',
},

imagePreview: {
  width: '90%',
  height: '80%',
},
// استایل‌های جدید برای مودال ویرایش محصول
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
modalContainerNew: {
  backgroundColor: '#fff',
  borderRadius: 16,
  width: '100%',
  maxWidth: 400,
  maxHeight: '80%',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
  overflow: 'hidden',
},
modalHeader: {
  backgroundColor: '#1e3a8a',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 20,
},
modalTitle: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
closeIconButton: {
  padding: 4,
},
modalBody: {
  padding: 20,
},
productInfoCard: {
  backgroundColor: '#f8fafc',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
},
productHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
},
productName: {
  fontSize: 14,
   fontFamily: "IRANYekan",
   marginRight:5,
  color: '#1e293b',
  flex: 1,
},
productCode: {
  fontSize: 12,
  color: '#64748b',
  textAlign: 'left',
},
inventoryCard: {
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
  borderWidth: 1,
},
inventorySuccess: {
  backgroundColor: '#f0fdf4',
  borderColor: '#bbf7d0',
},
inventoryError: {
  backgroundColor: '#fef2f2',
  borderColor: '#fecaca',
},
inventoryHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  justifyContent: 'center',
},
inventoryText: {
  fontSize: 14,
  fontFamily: "IRANYekan",
},
errorCard: {
  backgroundColor: '#fef2f2',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#fecaca',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
errorText: {
  color: '#dc2626',
  fontSize: 13,
  fontWeight: '500',
  flex: 1,
},
inputsContainer: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 16,
},
inputGroup: {
  flex: 1,
},
inputLabel: {
  fontSize: 13,
  color: '#475569',
  marginBottom: 6,
  textAlign: 'center',
  fontWeight: '500',
},
inputField: {
  backgroundColor: '#fff',
  borderWidth: 2,
  borderColor: '#e2e8f0',
  borderRadius: 10,
  padding: 12,
  fontSize: 16,
  fontWeight: '600',
  color: '#1e293b',
},
inputError: {
  borderColor: '#ef4444',
  backgroundColor: '#fef2f2',
},
totalCountCard: {
  backgroundColor: '#f1f5f9',
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#e2e8f0',
},
totalCountLabel: {
  fontSize: 15,
  color: '#475569',
  fontFamily: "IRANYekan",
},
totalCountValue: {
  fontSize: 18,
  fontFamily: "IRANYekan",
  color: '#1e3a8a',
},
totalCountZero: {
  color: '#94a3b8',
},
totalCountError: {
  color: '#dc2626',
},
priceCard: {
  backgroundColor: '#eff6ff',
  padding: 12,
  borderRadius: 10,
  marginBottom: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#dbeafe',
},
priceLabel: {
  fontSize: 14,
  color: '#374151',
  fontWeight: '500',
},
priceValue: {
  fontSize: 16,
  fontFamily: "IRANYekan",
  color: '#1e3a8a',
},
actionButtons: {
  flexDirection: 'row',
  gap: 12,
},
actionButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingVertical: 14,
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
cancelButton: {
  backgroundColor: '#f8fafc',
  borderWidth: 2,
  borderColor: '#e2e8f0',
},
saveButton: {
  backgroundColor: '#1e3a8a',
},
saveButtonDisabled: {
  backgroundColor: '#cbd5e1',
},
buttonText: {
  fontSize: 15,
  fontWeight: '600',
},
cancelButtonText: {
  color: '#64748b',
},
saveButtonText: {
  color: '#fff',
},
saveButtonTextDisabled: {
  color: '#9ca3af',
},
});