import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Gender, Product, ProductsResponse } from '@products/interfaces/product.interface';
import { delay, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../../auth/interfaces/user.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  gender?: string;
}

const emptyProduct: Product = {
  id: 'new',
  title: '',
  price: 0,
  description: '',
  slug: '',
  stock: 0,
  sizes: [],
  gender: Gender.Men,
  tags: [],
  images: [],
  user: {} as User,
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private productsCache = new Map<string, ProductsResponse>();
  private productCache = new Map<string, Product>();



  getProducts(options: Options): Observable<ProductsResponse> {
    const { limit = 9, offset = 0, gender = '' } = options;

    const key = `${limit}-${offset}-${gender}`; //9-0-''

    if( this.productsCache.has(key) ) {
      return of(this.productsCache.get(key)!);
    }

    return this.http.get<ProductsResponse>(`${baseUrl}/products`, {
        params: {
          limit: limit,
          offset: offset,
          gender: gender,
        },
      })
      .pipe(
        tap((resp) => console.log(resp)),
        tap((resp) => this.productsCache.set(key, resp)),
      );
  }



  getProductByIdSlug(idSlug: string): Observable<Product> {
    if(this.productCache.has(idSlug)){
      return of(this.productCache.get(idSlug)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${idSlug}`)
      .pipe(
        delay(2000),
        tap((product) => this.productCache.set(idSlug, product)),
      );
  }



  getProductById(id: string): Observable<Product>{
    if(id === 'new'){
      return of(emptyProduct);
    }


    if(this.productCache.has(id)){
      return of(this.productCache.get(id)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${id}`)
      .pipe(
        delay(2000),
        tap((product) => this.productCache.set(id, product)),
      );
  }



  updateProduct( id: string, productLike: Partial<Product>, imageFileList?: FileList ): Observable<Product>{
    const token = localStorage.getItem('token');

    const currentImages = productLike.images ?? [];

    return this.uploadImages(imageFileList).pipe(
        map((imageNames) => ({
          ...productLike,
          images: [...currentImages, ...imageNames],
        })),
        switchMap((updatedProduct) =>
          this.http.patch<Product>(`${ baseUrl }/products/${ id }`, updatedProduct, {
            headers: {
                Authorization: `Bearer ${ token }`,
            }
          }),
        ),
        tap(( product ) => this.updateProductCache(product))
    );


    /*return this.http.patch<Product>(`${ baseUrl }/products/${ id }`, productLike, {
      headers: {
          Authorization: `Bearer ${ token }`,
        },
    }).pipe(
        tap(( product ) => this.updateProductCache(product))
    );
    */
  }



  createProduct( productLike: Partial<Product>, imageFileList?: FileList ): Observable<Product>{
    const token = localStorage.getItem('token');

    const currentImages = productLike.images ?? [];

    return this.uploadImages(imageFileList).pipe(
        map((imageNames) => ({
          ...productLike,
          images: [...currentImages, ...imageNames],
        })),
        switchMap((newProduct) =>
          this.http.post<Product>(`${ baseUrl }/products/`, newProduct, {
            headers: {
                Authorization: `Bearer ${ token }`,
            }
          }),
        ),
        tap(( product ) => this.updateProductCache(product))
    );


    // return this.http.post<Product>(`${ baseUrl }/products/`, productLike, {
    //   headers: {
    //       Authorization: `Bearer ${ token }`,
    //     },
    // }).pipe(
    //     tap(( product ) => this.updateProductCache(product))
    // );
  }



  updateProductCache(product: Product){
    const productId = product.id;

    this.productCache.set(productId, product);

    this.productsCache.forEach((productsResponse) => {
      productsResponse.products = productsResponse.products.map(
        (currentProduct) => {
          return currentProduct.id === productId ? product : currentProduct;
        }
      );
    })
  }



  uploadImages(images?: FileList): Observable<string[]>{
    if(!images) return of([]);

    const uploadObservables = Array.from(images).map((imageFile) =>
      this.uploadImage(imageFile)
    );

    return forkJoin(uploadObservables);
  }



  uploadImage(imageFile: File): Observable<string>{
    const formData = new FormData();
    formData.append('file', imageFile);

    return this.http.post<{fileName: string}>(`${baseUrl}/files/product`,formData)
      .pipe(
        map(resp => resp.fileName)
      );
  }





}
