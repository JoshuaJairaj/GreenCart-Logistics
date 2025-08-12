import React, { useState, useEffect } from 'react';
import { ordersAPI, routesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  // FilterIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Orders = () => {
  // State management
  const [orders, setOrders] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    valueRs: '',
    routeId: '',
    deliveryTime: '',
    status: 'pending'
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Status options
  const statusOptions = ['pending', 'assigned', 'delivered', 'cancelled'];

  // Fetch orders on component mount and pagination changes
  useEffect(() => {
    fetchOrders();
  }, [pagination.currentPage, statusFilter]);

  // Fetch routes for dropdown
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Fetch orders function
  const fetchOrders = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = { 
        page: page, 
        limit: 10
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await ordersAPI.getAll(params);
      
      setOrders(response.data.orders);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch routes function
  const fetchRoutes = async () => {
    try {
      const response = await routesAPI.getAll({ limit: 100 }); // Get all routes
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Fetch routes error:', error);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Open modal function
  const openModal = (mode, order = null) => {
    setModalMode(mode);
    setSelectedOrder(order);
    setErrors({});

    if (mode === 'add') {
      // Find next available order ID
      const existingOrderIds = orders.map(o => o.orderId);
      const nextId = Math.max(...existingOrderIds, 0) + 1;
      
      setFormData({
        orderId: nextId.toString(),
        valueRs: '',
        routeId: '',
        deliveryTime: '',
        status: 'pending'
      });
    } else if (order && (mode === 'edit' || mode === 'view')) {
      setFormData({
        orderId: order.orderId.toString(),
        valueRs: order.valueRs.toString(),
        routeId: order.routeId.toString(),
        deliveryTime: order.deliveryTime,
        status: order.status
      });
    }
    
    setShowModal(true);
  };

  // Close modal function
  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setFormData({
      orderId: '',
      valueRs: '',
      routeId: '',
      deliveryTime: '',
      status: 'pending'
    });
    setErrors({});
    setSubmitting(false);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Order ID validation
    const orderId = parseInt(formData.orderId);
    if (!formData.orderId || formData.orderId === '') {
      newErrors.orderId = 'Order ID is required';
    } else if (isNaN(orderId) || orderId < 1) {
      newErrors.orderId = 'Order ID must be a positive integer';
    } else if (modalMode === 'add') {
      // Check if order ID already exists (only for add mode)
      const existingOrder = orders.find(o => o.orderId === orderId);
      if (existingOrder) {
        newErrors.orderId = 'Order ID already exists';
      }
    }

    // Value validation
    const value = parseFloat(formData.valueRs);
    if (!formData.valueRs || formData.valueRs === '') {
      newErrors.valueRs = 'Order value is required';
    } else if (isNaN(value) || value < 0) {
      newErrors.valueRs = 'Order value must be greater than or equal to 0';
    }

    // Route ID validation
    const routeId = parseInt(formData.routeId);
    if (!formData.routeId || formData.routeId === '') {
      newErrors.routeId = 'Route is required';
    } else if (isNaN(routeId) || routeId < 1) {
      newErrors.routeId = 'Please select a valid route';
    }

    // Delivery time validation
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!formData.deliveryTime || formData.deliveryTime === '') {
      newErrors.deliveryTime = 'Delivery time is required';
    } else if (!timePattern.test(formData.deliveryTime)) {
      newErrors.deliveryTime = 'Delivery time must be in HH:MM format';
    }

    // Status validation
    if (!statusOptions.includes(formData.status)) {
      newErrors.status = 'Please select a valid status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setSubmitting(true);
      const orderData = {
        orderId: parseInt(formData.orderId),
        valueRs: parseFloat(formData.valueRs),
        routeId: parseInt(formData.routeId),
        deliveryTime: formData.deliveryTime,
        status: formData.status
      };

      if (modalMode === 'add') {
        await ordersAPI.create(orderData);
        toast.success('Order created successfully!');
        fetchOrders(1); // Reset to first page
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      } else if (modalMode === 'edit') {
        await ordersAPI.update(selectedOrder._id, orderData);
        toast.success('Order updated successfully!');
        fetchOrders();
      }

      closeModal();
    } catch (error) {
      console.error('Order operation error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details?.[0]?.msg || 
                          'Operation failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete order
  const handleDelete = async (order) => {
    const confirmMessage = `Are you sure you want to delete Order #${order.orderId}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await ordersAPI.delete(order._id);
        toast.success('Order deleted successfully!');
        
        // If we're on the last item of the last page, go to previous page
        const remainingItems = pagination.total - 1;
        const maxPage = Math.ceil(remainingItems / 10);
        const targetPage = pagination.currentPage > maxPage ? Math.max(1, maxPage) : pagination.currentPage;
        
        if (targetPage !== pagination.currentPage) {
          setPagination(prev => ({ ...prev, currentPage: targetPage }));
        } else {
          fetchOrders();
        }
      } catch (error) {
        console.error('Delete order error:', error);
        toast.error('Failed to delete order');
      }
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'assigned':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get route info
  const getRouteInfo = (routeId) => {
    return routes.find(route => route.routeId === routeId);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.orderId.toString().includes(searchTerm) ||
    order.valueRs.toString().includes(searchTerm) ||
    order.routeId.toString().includes(searchTerm) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
            page === pagination.currentPage
              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage delivery orders ({pagination.total} total)</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="btn btn-primary flex items-center justify-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Order
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search orders by ID, value, route, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="input min-w-[120px]"
          >
            <option value="">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="card">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || statusFilter ? 'No matching orders found' : 'No orders found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter ? 'Try adjusting your search or filter criteria' : 'Get started by adding a new order.'}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                <button 
                  onClick={() => openModal('add')}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Order
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusColor = getStatusColor(order.status);
                  const routeInfo = getRouteInfo(order.routeId);
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <ShoppingBagIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Order #{order.orderId}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {order._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CurrencyRupeeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {order.valueRs.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <div>
                            <div className="text-sm text-gray-900">Route #{order.routeId}</div>
                            {routeInfo && (
                              <div className="text-xs text-gray-500">
                                {routeInfo.distanceKm}km, {routeInfo.trafficLevel} traffic
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{order.deliveryTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal('view', order)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', order)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Edit Order"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Order"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && !searchTerm && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * 10, pagination.total)}
                  </span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  
                  {renderPaginationButtons()}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
              onClick={closeModal}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Modal Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {modalMode === 'add' && 'Add New Order'}
                    {modalMode === 'edit' && 'Edit Order'}
                    {modalMode === 'view' && 'Order Details'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Content */}
                {modalMode === 'view' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order ID</label>
                      <p className="mt-1 text-sm text-gray-900">#{selectedOrder?.orderId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Order Value</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedOrder?.valueRs.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Route</label>
                      <p className="mt-1 text-sm text-gray-900">Route #{selectedOrder?.routeId}</p>
                      {(() => {
                        const routeInfo = getRouteInfo(selectedOrder?.routeId);
                        return routeInfo && (
                          <p className="text-xs text-gray-500">
                            {routeInfo.distanceKm}km, {routeInfo.trafficLevel} traffic, {routeInfo.baseTimeMin} min base time
                          </p>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedOrder?.deliveryTime}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder?.status)}`}>
                          {selectedOrder?.status?.charAt(0).toUpperCase() + selectedOrder?.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order ID Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Order ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.orderId}
                        onChange={(e) => handleInputChange('orderId', e.target.value)}
                        className={`mt-1 input ${errors.orderId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter order ID"
                        disabled={submitting || modalMode === 'edit'}
                      />
                      {errors.orderId && (
                        <p className="mt-1 text-sm text-red-600">{errors.orderId}</p>
                      )}
                      {modalMode === 'edit' && (
                        <p className="mt-1 text-xs text-gray-500">Order ID cannot be changed</p>
                      )}
                    </div>

                    {/* Order Value Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Order Value (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.valueRs}
                        onChange={(e) => handleInputChange('valueRs', e.target.value)}
                        className={`mt-1 input ${errors.valueRs ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter order value"
                        disabled={submitting}
                      />
                      {errors.valueRs && (
                        <p className="mt-1 text-sm text-red-600">{errors.valueRs}</p>
                      )}
                    </div>

                    {/* Route Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Route <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.routeId}
                        onChange={(e) => handleInputChange('routeId', e.target.value)}
                        className={`mt-1 input ${errors.routeId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={submitting}
                      >
                        <option value="">Select a route</option>
                        {routes.map(route => (
                          <option key={route._id} value={route.routeId}>
                            Route #{route.routeId} - {route.distanceKm}km ({route.trafficLevel} traffic)
                          </option>
                        ))}
                      </select>
                      {errors.routeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.routeId}</p>
                      )}
                    </div>

                    {/* Delivery Time Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.deliveryTime}
                        onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                        className={`mt-1 input ${errors.deliveryTime ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={submitting}
                      />
                      {errors.deliveryTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.deliveryTime}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Expected delivery time in 24-hour format
                      </p>
                    </div>

                    {/* Status Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className={`mt-1 input ${errors.status ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={submitting}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      {errors.status && (
                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {modalMode !== 'view' ? (
                  <>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 btn btn-primary text-base font-medium sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          {modalMode === 'add' ? 'Adding...' : 'Updating...'}
                        </>
                      ) : (
                        modalMode === 'add' ? 'Add Order' : 'Update Order'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={submitting}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
