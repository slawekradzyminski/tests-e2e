import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/products';

test.describe('Products screen', () => {
  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productsPage","catalog"]))('combines category and case-insensitive search', { tags: ['ai', 'act-expansion', 'scale'] }, async ({ productsPage, catalog, agent }) => {
    // given
    await productsPage.open();
    await productsPage.selectCategory(catalog.category);

    // when
    await productsPage.searchWithAgent(agent);

    // then
    await productsPage.expectProducts([catalog.products[1].name]);
    await productsPage.expectResultsMeaning(agent, [catalog.products[1].name]);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productsPage","catalog"]))('sorts a category by price in both directions', { tags: ['ai', 'act-expansion', 'scale', 'four-operations'] }, async ({ productsPage, catalog, agent }) => {
    // given
    await productsPage.open();
    await productsPage.selectCategory(catalog.category);
    const [alpha, beta, gamma] = catalog.products;

    // when
    await productsPage.sortWithAgent(agent);

    // then
    await productsPage.expectProducts([beta.name, gamma.name, alpha.name]);
    await productsPage.expectSortedMeaning(agent, 'ascending');
    await productsPage.expectCatalogExtraction(agent, [beta.name, gamma.name, alpha.name]);

    // when
    await productsPage.sortDescendingWithAgent(agent);

    // then
    await productsPage.expectProducts([alpha.name, gamma.name, beta.name]);
    await productsPage.expectSortedMeaning(agent, 'descending');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productsPage","catalog"]))('recovers from no search results within the selected category', { tags: ['ai', 'scale'] }, async ({ productsPage, catalog, agent }) => {
    // given
    await productsPage.open();
    await productsPage.selectCategory(catalog.category);
    await productsPage.search('no-matching-catalog-item');
    await productsPage.expectNoResults();
    await productsPage.expectNoResultsMeaning(agent);

    // when
    await productsPage.clearSearchWithAgent(agent);

    // then
    await productsPage.expectProducts(catalog.products.map((product: import('../../types/product').ProductDto) => product.name));
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productsPage","productDetailsPage","catalog"]))('opens the selected product details', { tags: ['ai', 'scale'] }, async ({ productsPage, productDetailsPage, catalog, agent }) => {
    // given
    await productsPage.open();
    const product = catalog.products[0];

    // when
    await productsPage.detailsWithAgent(product.name, agent);

    // then
    await productDetailsPage.expectUrl(product.id);
    await productDetailsPage.expectProduct(product);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productsPage","catalog","account","cartWithOtherProduct"]))('keeps cart items, header count and toasts consistent across add, update and remove', { tags: ['ai', 'scale'] }, async ({ productsPage, catalog, account, cartWithOtherProduct, agent }) => {
    // given
    await productsPage.open();
    const product = catalog.products[0];
    const card = productsPage.product(product.name);
    const otherItem = { productId: cartWithOtherProduct.id, quantity: 1 };
    await productsPage.header.expectCartCount(1);

    // when
    await productsPage.saveProductWithAgent(product.name, 2, agent);

    // then
    await productsPage.toast.expectMessage('Added to cart', `2 × ${product.name} added to your cart`);
    await card.expectInCart(2);
    await productsPage.expectCatalogCartMeaning(agent, product.name, 2, 3);
    await productsPage.header.expectCartCount(3);
    await productsPage.expectCartItems(account.token, [otherItem, { productId: product.id, quantity: 2 }]);
    await productsPage.expectUrl();
    await productsPage.reload();
    await card.expectInCart(2);
    await productsPage.expectCatalogCartMeaning(agent, product.name, 2, 3);
    await productsPage.header.expectCartCount(3);

    // when
    await productsPage.saveProductWithAgent(product.name, 3, agent);

    // then
    await productsPage.toast.expectMessage('Cart updated', `${product.name} quantity set to 3`);
    await card.expectInCart(3);
    await productsPage.expectCatalogCartMeaning(agent, product.name, 3, 4);
    await productsPage.header.expectCartCount(4);
    await productsPage.expectCartItems(account.token, [otherItem, { productId: product.id, quantity: 3 }]);
    await productsPage.reload();
    await card.expectInCart(3);
    await productsPage.expectCatalogCartMeaning(agent, product.name, 3, 4);
    await productsPage.header.expectCartCount(4);

    // when
    await productsPage.removeProductWithAgent(product.name, agent);

    // then
    await productsPage.toast.expectMessage('Removed from cart', `${product.name} has been removed from your cart`);
    await card.expectNotInCart();
    await productsPage.header.expectCartCount(1);
    await productsPage.expectCartItems(account.token, [otherItem]);
    await productsPage.reload();
    await card.expectNotInCart();
    await productsPage.header.expectCartCount(1);

    // when
    await productsPage.removeProductWithAgent(cartWithOtherProduct.name, agent);

    // then
    await productsPage.toast.expectMessage('Removed from cart', `${cartWithOtherProduct.name} has been removed from your cart`);
    await productsPage.product(cartWithOtherProduct.name).expectNotInCart();
    await productsPage.expectCartItems(account.token, []);
    await productsPage.header.expectCartCount(0);
    await productsPage.reload();
    await productsPage.header.expectCartCount(0);
  });
});
