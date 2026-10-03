import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { EditUserPage } from '../../pages/edit-user-page';
import { AdminInventoryPage } from '../../pages/admin-inventory-page';
import { AdminOrdersPage } from '../../pages/admin-orders-page';
import { AdminProductFormPage } from '../../pages/admin-product-form-page';
import { AdminProductsPage } from '../../pages/admin-products-page';
import { OrderDetailsPage } from '../../pages/order-details-page';
import { CheckoutPage } from '../../pages/checkout-page';
import { ProductDetailsPage } from '../../pages/product-details-page';
import { UsersPage } from '../../pages/users-page';
import { AdminDashboardPage } from '../../pages/admin-dashboard-page';
import { TrafficMonitorPage } from '../../pages/traffic-monitor-page';
import { LlmPage } from '../../pages/llm-page';
import { QrCodePage } from '../../pages/qr-code-page';
import { EmailPage } from '../../pages/email-page';
import { CartPage } from '../../pages/cart-page';
import { ProfilePage } from '../../pages/profile-page';
import { ProductsPage } from '../../pages/products-page';

import { LoginPage } from '../../pages/login-page';
import { HomePage } from '../../pages/home-page';
import { RegisterPage } from '../../pages/register-page';
import { ForgotPasswordPage } from '../../pages/forgot-password-page';

export const fixtures = { request: requestFixture, page: pageFixture, ...{
  editUserPage: async ({ page }, use) => { await use(new EditUserPage(page)); },
  adminInventoryPage: async ({ page }, use) => { await use(new AdminInventoryPage(page)); },
  adminOrdersPage: async ({ page }, use) => { await use(new AdminOrdersPage(page)); },
  adminProductFormPage: async ({ page }, use) => { await use(new AdminProductFormPage(page)); },
  adminProductsPage: async ({ page }, use) => { await use(new AdminProductsPage(page)); },
  orderDetailsPage: async ({ page }, use) => { await use(new OrderDetailsPage(page)); },
  checkoutPage: async ({ page }, use) => { await use(new CheckoutPage(page)); },
  usersPage: async ({ page }, use) => { await use(new UsersPage(page)); },
  emailPage: async ({ page }, use) => { await use(new EmailPage(page)); },
  qrCodePage: async ({ page }, use) => { await use(new QrCodePage(page)); },
  llmPage: async ({ page }, use) => { await use(new LlmPage(page)); },
  trafficMonitorPage: async ({ page }, use) => { await use(new TrafficMonitorPage(page)); },
  adminDashboardPage: async ({ page }, use) => { await use(new AdminDashboardPage(page)); },
  productDetailsPage: async ({ page }, use) => { await use(new ProductDetailsPage(page)); },
  productsPage: async ({ page }, use) => { await use(new ProductsPage(page)); },
  profilePage: async ({ page }, use) => { await use(new ProfilePage(page)); },
  cartPage: async ({ page }, use) => { await use(new CartPage(page)); },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  registerPage: async ({ page }, use) => { await use(new RegisterPage(page)); },
  forgotPasswordPage: async ({ page }, use) => { await use(new ForgotPasswordPage(page)); },
} } satisfies FixtureRegistry;
export const dependencies = { request: [], page: ["request"],  editUserPage: ["page"], adminInventoryPage: ["page"], adminOrdersPage: ["page"], adminProductFormPage: ["page"], adminProductsPage: ["page"], orderDetailsPage: ["page"], checkoutPage: ["page"], usersPage: ["page"], emailPage: ["page"], qrCodePage: ["page"], llmPage: ["page"], trafficMonitorPage: ["page"], adminDashboardPage: ["page"], productDetailsPage: ["page"], productsPage: ["page"], profilePage: ["page"], cartPage: ["page"], loginPage: ["page"], homePage: ["page"], registerPage: ["page"], forgotPasswordPage: ["page"] };
