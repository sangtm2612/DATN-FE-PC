import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import MainLayout from '@/layouts/MainLayout'
import AdminLayout from '@/layouts/AdminLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import AdminRoute from '@/components/common/AdminRoute'
import PageLoader from '@/components/common/PageLoader'

// Lazy load pages
const HomePage        = lazy(() => import('@/pages/HomePage'))
const ProductListPage = lazy(() => import('@/pages/ProductListPage'))
const ProductDetail   = lazy(() => import('@/pages/ProductDetailPage'))
const BuildPCPage     = lazy(() => import('@/pages/BuildPCPage'))
const CartPage        = lazy(() => import('@/pages/CartPage'))
const CheckoutPage    = lazy(() => import('@/pages/CheckoutPage'))
const OrderSuccess    = lazy(() => import('@/pages/OrderSuccessPage'))
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'))
const TrackOrderPage  = lazy(() => import('@/pages/TrackOrderPage'))
const WarrantyPage    = lazy(() => import('@/pages/WarrantyPage'))
const StorePage       = lazy(() => import('@/pages/StorePage'))
const BlogPage        = lazy(() => import('@/pages/BlogPage'))
const BlogDetailPage  = lazy(() => import('@/pages/BlogDetailPage'))
const SearchPage      = lazy(() => import('@/pages/SearchPage'))
const NotFoundPage    = lazy(() => import('@/pages/NotFoundPage'))

// Auth
const LoginPage    = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPage   = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPage    = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// Account
const AccountPage       = lazy(() => import('@/pages/account/AccountPage'))
const ProfilePage       = lazy(() => import('@/pages/account/ProfilePage'))
const AddressPage       = lazy(() => import('@/pages/account/AddressPage'))
const OrderHistoryPage  = lazy(() => import('@/pages/account/OrderHistoryPage'))
const OrderDetailPage   = lazy(() => import('@/pages/account/OrderDetailPage'))
const WishlistPage      = lazy(() => import('@/pages/account/WishlistPage'))
const MyWarrantyPage    = lazy(() => import('@/pages/account/MyWarrantyPage'))
const MyBuildsPage      = lazy(() => import('@/pages/account/MyBuildsPage'))
const ReturnRequestPage = lazy(() => import('@/pages/account/ReturnRequestPage'))

// Admin
const AdminDashboard    = lazy(() => import('@/pages/admin/DashboardPage'))
const AdminProducts     = lazy(() => import('@/pages/admin/ProductsPage'))
const AdminOrders       = lazy(() => import('@/pages/admin/OrdersPage'))
const AdminCategories   = lazy(() => import('@/pages/admin/CategoriesPage'))
const AdminBrands       = lazy(() => import('@/pages/admin/BrandsPage'))
const AdminBanners      = lazy(() => import('@/pages/admin/BannersPage'))
const AdminBlog         = lazy(() => import('@/pages/admin/BlogPage'))
const AdminStores       = lazy(() => import('@/pages/admin/StoresPage'))
const AdminVouchers     = lazy(() => import('@/pages/admin/VouchersPage'))
const AdminPromotions   = lazy(() => import('@/pages/admin/PromotionsPage'))
const AdminStoreStock   = lazy(() => import('@/pages/admin/StoreStockPage'))
const AdminServiceRequests = lazy(() => import('@/pages/admin/ServiceRequestsPage'))
const AdminReturnRequests = lazy(() => import('@/pages/admin/ReturnRequestsPage'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route path="/reset-password"  element={<ResetPage />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"                 element={<AdminDashboard />} />
            <Route path="/admin/products"        element={<AdminProducts />} />
            <Route path="/admin/orders"          element={<AdminOrders />} />
            <Route path="/admin/categories"      element={<AdminCategories />} />
            <Route path="/admin/brands"          element={<AdminBrands />} />
            <Route path="/admin/banners"         element={<AdminBanners />} />
            <Route path="/admin/blog"            element={<AdminBlog />} />
            <Route path="/admin/stores"          element={<AdminStores />} />
            <Route path="/admin/vouchers"        element={<AdminVouchers />} />
            <Route path="/admin/promotions"      element={<AdminPromotions />} />
            <Route path="/admin/store-stock"     element={<AdminStoreStock />} />
            <Route path="/admin/service-requests" element={<AdminServiceRequests />} />
            <Route path="/admin/return-requests" element={<AdminReturnRequests />} />
          </Route>
        </Route>

        {/* Main site */}
        <Route element={<MainLayout />}>
          <Route path="/"                      element={<HomePage />} />
          <Route path="/products"              element={<ProductListPage />} />
          <Route path="/category/:slug"        element={<ProductListPage />} />
          <Route path="/brand/:slug"           element={<ProductListPage />} />
          <Route path="/san-pham/:slug"        element={<ProductDetail />} />
          <Route path="/build-pc"              element={<BuildPCPage />} />
          <Route path="/gio-hang"              element={<CartPage />} />
          <Route path="/tim-kiem"              element={<SearchPage />} />
          <Route path="/tra-don-hang"          element={<TrackOrderPage />} />
          <Route path="/payment-result"        element={<PaymentResultPage />} />
          <Route path="/tra-bao-hanh"          element={<WarrantyPage />} />
          <Route path="/cua-hang"              element={<StorePage />} />
          <Route path="/tin-tuc"               element={<BlogPage />} />
          <Route path="/tin-tuc/:slug"         element={<BlogDetailPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout"              element={<CheckoutPage />} />
            <Route path="/order-success/:code"   element={<OrderSuccess />} />
            <Route path="/account"               element={<AccountPage />}>
              <Route index                       element={<ProfilePage />} />
              <Route path="profile"             element={<ProfilePage />} />
              <Route path="addresses"           element={<AddressPage />} />
              <Route path="orders"              element={<OrderHistoryPage />} />
              <Route path="orders/:id"          element={<OrderDetailPage />} />
              <Route path="orders/:id/return"   element={<ReturnRequestPage />} />
              <Route path="wishlist"            element={<WishlistPage />} />
              <Route path="warranties"          element={<MyWarrantyPage />} />
              <Route path="builds"              element={<MyBuildsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
