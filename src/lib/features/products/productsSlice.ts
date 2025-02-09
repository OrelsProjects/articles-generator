import { createSlice } from "@reduxjs/toolkit";
import { Product, Coupon } from "@/types/payment";

export interface ProductsState {
  products: Product[];
  coupon: Coupon | null;
}

export const initialState: ProductsState = {
  products: [],
  coupon: null,
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts(state, action) {
      state.products = action.payload;
    },
    setCoupon(state, action) {
      state.coupon = action.payload;
    },
  },
});

export const { setProducts, setCoupon } = productsSlice.actions;

export default productsSlice.reducer;
