import React, {useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Cart from "./Cart";
import toast, { Toaster } from "react-hot-toast";
import CustomerSelect from "./CutomerSelect";
import InstallmentForm from "./InstallmentForm";

import SuccessSound from "../sounds/beep-07a.mp3";
import WarningSound from "../sounds/beep-02.mp3";
import playSound from "../utils/playSound";

export default function Pos() {
    const [products, setProducts] = useState([]);
    const [carts, setCarts] = useState([]);
    const [orderDiscount, setOrderDiscount] = useState(0);
    const [paid, setPaid] = useState(0);
    const [due, setDue] = useState(0);
    const [total, setTotal] = useState(0);
    const [updateTotal, setUpdateTotal] = useState(0);
    const [customerId, setCustomerId] = useState();
    const [cartUpdated, setCartUpdated] = useState(false);
    const [productUpdated, setProductUpdated] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchBarcode, setSearchBarcode] = useState("");
    const { protocol, hostname, port } = window.location;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const fullDomainWithPort = `${protocol}//${hostname}${
        port ? `:${port}` : ""
    }`;
    const [purchaseType, setPurchaseType] = useState("cash"); // 'cash' or 'installment'
    const [showInstallmentForm, setShowInstallmentForm] = useState(false);
    const [selectedInstallmentProduct, setSelectedInstallmentProduct] = useState(null);
    const getProducts = useCallback(
        async (search = "", page = 1, barcode = "") => {
            setLoading(true);
            try {
                const res = await axios.get('/admin/get/products', {
                    params: { search, page, barcode },
                });
                const productsData = res.data;
                setProducts((prev) => [...prev, ...productsData.data]); // Append new products
                if (productsData.data.length === 1 && barcode != "") {
                    addProductToCart(productsData.data[0].id);
                    getCarts();
                }
                setTotalPages(productsData.meta.last_page); // Get total pages
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false); // Set loading to false
            }
        },
        []
    );
    const getUpdatedProducts = useCallback(async () => {
        try {
            const res = await axios.get('/admin/get/products');
            const productsData = res.data;
            setProducts(productsData.data);
            setTotalPages(productsData.meta.last_page); // Get total pages
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }, []);
    useEffect(() => {
        getUpdatedProducts();
    }, [productUpdated]);

    const getCarts = async () => {
        try {
            const res = await axios.get('/admin/cart');
            const data = res.data;
            setTotal(data?.total);
            setUpdateTotal(data?.total - orderDiscount);
            setCarts(data?.carts);
        } catch (error) {
            console.error("Error fetching carts:", error);
        }
    };

    useEffect(() => {
        getCarts();
    }, []);

    useEffect(() => {
        getCarts();
    }, [cartUpdated]);

    useEffect(() => {
        let paid1 = paid;
        let disc = orderDiscount;
        if (paid == "") {
            paid1 = 0;
        }
        if (orderDiscount == "") {
            disc = 0;
        }
        const updatedTotalAmount = parseFloat(total) - parseFloat(disc);
        const dueAmount = updatedTotalAmount - parseFloat(paid1);
        setUpdateTotal(updatedTotalAmount?.toFixed(2));
        setDue(dueAmount?.toFixed(2));
    }, [orderDiscount, paid, total]);
    useEffect(() => {
        if (searchQuery) {
            setProducts([]);
            getProducts(searchQuery, currentPage, "");
        }
        setSearchBarcode("");
    }, [currentPage, searchQuery]);

    useEffect(() => {
        if (searchBarcode) {
            setProducts([]);
           getProducts("", currentPage, searchBarcode);
        }
    }, [searchBarcode]);

    // Infinite scroll logic
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight
            ) {
                // Load next page if not on the last page
                if (currentPage < totalPages) {
                    setCurrentPage((prev) => prev + 1);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [currentPage, totalPages]);

    function addProductToCart(id) {
        if (purchaseType === "installment") {
            // Find the product from products list
            const product = products.find((p) => p.id === id);
            setSelectedInstallmentProduct(product);
            setShowInstallmentForm(true);
            return;
        }
        axios
            .post("/admin/cart", { id })
            .then((res) => {
                setCartUpdated(!cartUpdated);
                playSound(SuccessSound);
                toast.success(res?.data?.message);
            })
            .catch((err) => {
                playSound(WarningSound);
                toast.error(err.response.data.message);
            });
    }
    function cartEmpty() {
        if (total <= 0) {
            return;
        }
        Swal.fire({
            title: "Are you sure you want to delete Cart?",
            showDenyButton: true,
            confirmButtonText: "Yes",
            denyButtonText: "No",
            customClass: {
                actions: "my-actions",
                cancelButton: "order-1 right-gap",
                confirmButton: "order-2",
                denyButton: "order-3",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .put("/admin/cart/empty")
                    .then((res) => {
                        setCartUpdated(!cartUpdated);
                        playSound(SuccessSound);
                        toast.success(res?.data?.message);
                    })
                    .catch((err) => {
                        playSound(WarningSound);
                        toast.error(err.response.data.message);
                    });
            } else if (result.isDenied) {
                return;
            }
        });
    }
    function orderCreate() {
        if (total <= 0) {
            return;
        }
        if (!customerId) {
            toast.error("Please select customer");
            return;
        }
        Swal.fire({
            title: `Are you sure you want to complete this order? <br>Due: ${due}`,
            showDenyButton: true,
            confirmButtonText: "Yes",
            denyButtonText: "No",
            customClass: {
                actions: "my-actions",
                cancelButton: "order-1 right-gap",
                confirmButton: "order-2",
                denyButton: "order-3",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .put("/admin/order/create", {
                        customer_id: customerId,
                        order_discount: parseFloat(orderDiscount) || 0,
                        paid: parseFloat(paid) || 0,
                    })
                    .then((res) => {
                        setCartUpdated(!cartUpdated);
                        setProductUpdated(!productUpdated);
                        toast.success(res?.data?.message);
                        // window.location.href = `orders/invoice/${res?.data?.order?.id}`;
                        window.location.href = `orders/pos-invoice/${res?.data?.order?.id}`;
                    })
                    .catch((err) => {
                        toast.error(err.response.data.message);
                    });
            } else if (result.isDenied) {
                return;
            }
        });
    }
    // Handle InstallmentForm submit
    const handleInstallmentSubmit = async (formData) => {
        // Prepare FormData for file upload
        const data = new FormData();
        data.append("product_id", selectedInstallmentProduct.id);
        Object.entries(formData.customer).forEach(([key, value]) => {
            data.append(`customer_${key}`, value);
        });
        Object.entries(formData.guarantor).forEach(([key, value]) => {
            data.append(`guarantor_${key}`, value);
        });
        Object.entries(formData.details).forEach(([key, value]) => {
            data.append(`details_${key}`, value);
        });
        // No change needed, as interest_rate is now included in details
        try {
            await axios.post("/admin/installment-sale", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Installment sale created successfully!");
            setShowInstallmentForm(false);
            setSelectedInstallmentProduct(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error creating installment sale");
        }
    };
    return (
        <>
            <div className="card">
            

                <div className="card-body p-2 p-md-4 pt-0">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="btn-group" role="group">
                                <button
                                    className={`btn btn-${purchaseType === "cash" ? "primary" : "secondary"}`}
                                    onClick={() => setPurchaseType("cash")}
                                >
                                    Cash Purchase
                                </button>
                                <button
                                    className={`btn btn-${purchaseType === "installment" ? "primary" : "secondary"}`}
                                    onClick={() => setPurchaseType("installment")}
                                >
                                    Installment Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 col-lg-5 mb-2">
                            <div className="row mb-2">
                                <div className="col-12">
                                    <CustomerSelect
                                        setCustomerId={setCustomerId}
                                    />
                                </div>
                                {/* <div className="col-6">
                                <form className="form">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter barcode"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                    />
                                </form>
                            </div> */}
                            </div>
                            <Cart
                                carts={carts}
                                setCartUpdated={setCartUpdated}
                                cartUpdated={cartUpdated}
                            />
                            <div className="card">
                                <div className="card-body">
                                    <div className="row text-bold mb-1">
                                        <div className="col">Sub Total:</div>
                                        <div className="col text-right mr-2">
                                            {total}
                                        </div>
                                    </div>
                                    <div className="row text-bold mb-1">
                                        <div className="col">Discount:</div>
                                        <div className="col text-right mr-2">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Enter discount"
                                                min={0}
                                                disabled={total <= 0}
                                                value={orderDiscount}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    if (
                                                        parseFloat(value) >
                                                            total ||
                                                        parseFloat(value) < 0
                                                    ) {
                                                        return;
                                                    }
                                                    setOrderDiscount(value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row text-bold mb-1">
                                        <div className="col">
                                            Apply Fractional Discount:
                                        </div>
                                        <div className="col text-right mr-2">
                                            <input
                                                type="checkbox"
                                                className="form-control-sm"
                                                disabled={total <= 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const fractionalPart =
                                                            total % 1;
                                                        setOrderDiscount(
                                                            fractionalPart?.toFixed(
                                                                2
                                                            )
                                                        );
                                                    } else {
                                                        setOrderDiscount(0);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row text-bold mb-1">
                                        <div className="col">Total:</div>
                                        <div className="col text-right mr-2">
                                            {updateTotal}
                                        </div>
                                    </div>
                                    <div className="row text-bold mb-1">
                                        <div className="col">Paid:</div>
                                        <div className="col text-right mr-2">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Enter paid"
                                                min={0}
                                                disabled={total <= 0}
                                                value={paid}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    if (
                                                        parseFloat(value) < 0 ||
                                                        parseFloat(value) >
                                                            updateTotal
                                                    ) {
                                                        return;
                                                    }
                                                    setPaid(value);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row text-bold">
                                        <div className="col">Due:</div>
                                        <div className="col text-right mr-2">
                                            {due}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col">
                                    <button
                                        onClick={() => cartEmpty()}
                                        type="button"
                                        className="btn bg-gradient-danger btn-block text-white text-bold"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                                <div className="col">
                                    <button
                                        onClick={() => {
                                            orderCreate();
                                        }}
                                        type="button"
                                        className="btn bg-gradient-primary btn-block text-white text-bold"
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-7">
                            <div className="row">
                                <div className="input-group mb-2 col-md-6">
                                    <div class="input-group-prepend">
                                        <span class="input-group-text">
                                            <i class="fas fa-barcode"></i>
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter Product Barcode"
                                        value={searchBarcode}
                                        autoFocus
                                        onChange={(e) =>
                                            setSearchBarcode(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="mb-2 col-md-6">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter Product Name"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="row products-card-container">
                                {products.length > 0 &&
                                    products.map((product, index) => (
                                        <div
                                            onClick={() => addProductToCart(product.id)}
                                            className="col-6 col-md-4 col-lg-3 mb-3"
                                            key={index}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="text-center">
                                                <img
                                                    src={`${fullDomainWithPort}/storage/${product.image}`}
                                                    alt={product.name}
                                                    className="mr-2 img-thumb"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `${fullDomainWithPort}/assets/images/no-image.png`;
                                                    }}
                                                    width={120}
                                                    height={100}
                                                />
                                                <div className="product-details">
                                                    <p className="mb-0 text-bold product-name">
                                                        {product.name} (
                                                        {product.quantity})
                                                    </p>
                                                    <p>
                                                        Price: {product?.discounted_price}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            {loading && (
                                <div className="loading-more">
                                    Loading more...
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Installment Form Modal */}
                    {showInstallmentForm && selectedInstallmentProduct && (
                        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog modal-lg" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Installment Sale</h5>
                                        <button type="button" className="close" onClick={() => setShowInstallmentForm(false)}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <InstallmentForm
                                            product={selectedInstallmentProduct}
                                            onSubmit={handleInstallmentSubmit}
                                            onCancel={() => setShowInstallmentForm(false)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}