export class CreateInventoryItemDto {
  category!: 'CLOTHING' | 'TECH' | 'TOILETRIES' | 'DOCUMENTS' | 'OTHER';
  name!: string;
  quantity!: number;
  assignedToId?: string;
}
