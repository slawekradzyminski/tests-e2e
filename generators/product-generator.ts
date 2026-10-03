
import { faker } from '@faker-js/faker';
import type { ProductCreateDto } from '../types/product';

export class ProductGenerator {
  static generate(overrides: Partial<ProductCreateDto> = {}): ProductCreateDto {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: Number(faker.commerce.price({ min: 0.01, max: 1000, dec: 2 })),
      stockQuantity: faker.number.int({ min: 0, max: 500 }),
      category: faker.commerce.department(),
      imageUrl: 'https://example.com/product.png',
      ...overrides,
    };
  }
}
