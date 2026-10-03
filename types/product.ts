
export interface ProductCreateDto {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl?: string;
}

export type ProductUpdateDto = Partial<ProductCreateDto>;

export interface ProductDto extends Omit<ProductCreateDto, 'imageUrl'> {
  id: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
