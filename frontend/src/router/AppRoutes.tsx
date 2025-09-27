import Layout from "@/layout/Layout";
import Landing from "@/pages/landing/Landing";
import Home from "@/pages/user/home/Home";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import { NFTGallery } from "@/pages/user/nft-gallery/NftGallery";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route
          path="/user/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
         <Route
          path="/user/nft-gallery"
          element={
            <ProtectedRoute>
              <NFTGallery />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
