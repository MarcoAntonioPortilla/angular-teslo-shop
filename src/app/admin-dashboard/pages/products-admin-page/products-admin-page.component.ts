import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductTableComponent } from "@products/components/product-table/product-table.component";
import { ProductsService } from '@products/services/products.service';
import { Pagination } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-products-admin-page',
  imports: [ProductTableComponent, Pagination, RouterLink],
  templateUrl: './products-admin-page.component.html',
})
export class ProductsAdminPageComponent {
  productsService = inject(ProductsService);
  paginationService = inject(PaginationService);

  productsPerPage = signal(10);


  productsResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage() - 1,
      limit: this.productsPerPage(),
     }),
    loader: ({ request }) => {
      return this.productsService.getProducts({
        offset: request.page * 9,
        limit: request.limit,
      });
    },
  });
}
