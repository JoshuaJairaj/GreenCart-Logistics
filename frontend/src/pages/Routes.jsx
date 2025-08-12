import React, { useState, useEffect } from 'react';
import { routesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  MapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Routes = () => {
  // State management
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    routeId: '',
    distanceKm: '',
    trafficLevel: 'Low',
    baseTimeMin: ''
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Traffic level options
  const trafficLevels = ['Low', 'Medium', 'High'];

  // Fetch routes on component mount and pagination changes
  useEffect(() => {
    fetchRoutes();
  }, [pagination.currentPage]);

  // Fetch routes function
  const fetchRoutes = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const response = await routesAPI.getAll({ 
        page: page, 
        limit: 10
      });
      
      setRoutes(response.data.routes);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Fetch routes error:', error);
      toast.error('Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  // Open modal function
  const openModal = (mode, route = null) => {
    setModalMode(mode);
    setSelectedRoute(route);
    setErrors({});

    if (mode === 'add') {
      // Find next available route ID
      const existingRouteIds = routes.map(r => r.routeId);
      const nextId = Math.max(...existingRouteIds, 0) + 1;
      
      setFormData({
        routeId: nextId.toString(),
        distanceKm: '',
        trafficLevel: 'Low',
        baseTimeMin: ''
      });
    } else if (route && (mode === 'edit' || mode === 'view')) {
      setFormData({
        routeId: route.routeId.toString(),
        distanceKm: route.distanceKm.toString(),
        trafficLevel: route.trafficLevel,
        baseTimeMin: route.baseTimeMin.toString()
      });
    }
    
    setShowModal(true);
  };

  // Close modal function
  const closeModal = () => {
    setShowModal(false);
    setSelectedRoute(null);
    setFormData({
      routeId: '',
      distanceKm: '',
      trafficLevel: 'Low',
      baseTimeMin: ''
    });
    setErrors({});
    setSubmitting(false);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Route ID validation
    const routeId = parseInt(formData.routeId);
    if (!formData.routeId || formData.routeId === '') {
      newErrors.routeId = 'Route ID is required';
    } else if (isNaN(routeId) || routeId < 1) {
      newErrors.routeId = 'Route ID must be a positive integer';
    } else if (modalMode === 'add') {
      // Check if route ID already exists (only for add mode)
      const existingRoute = routes.find(r => r.routeId === routeId);
      if (existingRoute) {
        newErrors.routeId = 'Route ID already exists';
      }
    }

    // Distance validation
    const distance = parseFloat(formData.distanceKm);
    if (!formData.distanceKm || formData.distanceKm === '') {
      newErrors.distanceKm = 'Distance is required';
    } else if (isNaN(distance) || distance < 0.1) {
      newErrors.distanceKm = 'Distance must be greater than 0';
    }

    // Traffic level validation
    if (!trafficLevels.includes(formData.trafficLevel)) {
      newErrors.trafficLevel = 'Traffic level must be Low, Medium, or High';
    }

    // Base time validation
    const baseTime = parseInt(formData.baseTimeMin);
    if (!formData.baseTimeMin || formData.baseTimeMin === '') {
      newErrors.baseTimeMin = 'Base time is required';
    } else if (isNaN(baseTime) || baseTime < 1) {
      newErrors.baseTimeMin = 'Base time must be at least 1 minute';
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
      const routeData = {
        routeId: parseInt(formData.routeId),
        distanceKm: parseFloat(formData.distanceKm),
        trafficLevel: formData.trafficLevel,
        baseTimeMin: parseInt(formData.baseTimeMin)
      };

      if (modalMode === 'add') {
        await routesAPI.create(routeData);
        toast.success('Route created successfully!');
        fetchRoutes(1); // Reset to first page
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      } else if (modalMode === 'edit') {
        await routesAPI.update(selectedRoute._id, routeData);
        toast.success('Route updated successfully!');
        fetchRoutes();
      }

      closeModal();
    } catch (error) {
      console.error('Route operation error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details?.[0]?.msg || 
                          'Operation failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete route
  const handleDelete = async (route) => {
    const confirmMessage = `Are you sure you want to delete Route ${route.routeId}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await routesAPI.delete(route._id);
        toast.success('Route deleted successfully!');
        
        // If we're on the last item of the last page, go to previous page
        const remainingItems = pagination.total - 1;
        const maxPage = Math.ceil(remainingItems / 10);
        const targetPage = pagination.currentPage > maxPage ? Math.max(1, maxPage) : pagination.currentPage;
        
        if (targetPage !== pagination.currentPage) {
          setPagination(prev => ({ ...prev, currentPage: targetPage }));
        } else {
          fetchRoutes();
        }
      } catch (error) {
        console.error('Delete route error:', error);
        toast.error('Failed to delete route');
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

  // Get traffic level color
  const getTrafficLevelColor = (trafficLevel) => {
    switch (trafficLevel) {
      case 'Low':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'High':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Calculate estimated speed (km/h)
  const calculateSpeed = (distanceKm, baseTimeMin) => {
    const hours = baseTimeMin / 60;
    return (distanceKm / hours).toFixed(1);
  };

  // Filter routes based on search term
  const filteredRoutes = routes.filter(route =>
    route.routeId.toString().includes(searchTerm) ||
    route.trafficLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.distanceKm.toString().includes(searchTerm)
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
        <span className="ml-2 text-gray-600">Loading routes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600 mt-1">Manage delivery routes ({pagination.total} total)</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="btn btn-primary flex items-center justify-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Route
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search routes by ID, traffic level, or distance..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Routes List */}
      <div className="card">
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-12">
            <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No matching routes found' : 'No routes found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding a new route.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button 
                  onClick={() => openModal('add')}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Route
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
                    Route ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Traffic Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Speed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoutes.map((route) => {
                  const trafficColor = getTrafficLevelColor(route.trafficLevel);
                  const avgSpeed = calculateSpeed(route.distanceKm, route.baseTimeMin);
                  
                  return (
                    <tr key={route._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <MapIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Route #{route.routeId}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {route._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{route.distanceKm} km</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${trafficColor}`}>
                          {route.trafficLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{route.baseTimeMin} min</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {avgSpeed} km/h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal('view', route)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', route)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Edit Route"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(route)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Route"
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
                    {modalMode === 'add' && 'Add New Route'}
                    {modalMode === 'edit' && 'Edit Route'}
                    {modalMode === 'view' && 'Route Details'}
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
                      <label className="block text-sm font-medium text-gray-700">Route ID</label>
                      <p className="mt-1 text-sm text-gray-900">#{selectedRoute?.routeId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Distance</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRoute?.distanceKm} km</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Traffic Level</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrafficLevelColor(selectedRoute?.trafficLevel)}`}>
                          {selectedRoute?.trafficLevel}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Base Time</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRoute?.baseTimeMin} minutes</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Average Speed</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRoute ? calculateSpeed(selectedRoute.distanceKm, selectedRoute.baseTimeMin) : '0'} km/h
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRoute ? new Date(selectedRoute.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Route ID Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Route ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.routeId}
                        onChange={(e) => handleInputChange('routeId', e.target.value)}
                        className={`mt-1 input ${errors.routeId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter route ID"
                        disabled={submitting || modalMode === 'edit'}
                      />
                      {errors.routeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.routeId}</p>
                      )}
                      {modalMode === 'edit' && (
                        <p className="mt-1 text-xs text-gray-500">Route ID cannot be changed</p>
                      )}
                    </div>

                    {/* Distance Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Distance (km) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formData.distanceKm}
                        onChange={(e) => handleInputChange('distanceKm', e.target.value)}
                        className={`mt-1 input ${errors.distanceKm ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter distance in kilometers"
                        disabled={submitting}
                      />
                      {errors.distanceKm && (
                        <p className="mt-1 text-sm text-red-600">{errors.distanceKm}</p>
                      )}
                    </div>

                    {/* Traffic Level Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Traffic Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.trafficLevel}
                        onChange={(e) => handleInputChange('trafficLevel', e.target.value)}
                        className={`mt-1 input ${errors.trafficLevel ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={submitting}
                      >
                        {trafficLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.trafficLevel && (
                        <p className="mt-1 text-sm text-red-600">{errors.trafficLevel}</p>
                      )}
                    </div>

                    {/* Base Time Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Base Time (minutes) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.baseTimeMin}
                        onChange={(e) => handleInputChange('baseTimeMin', e.target.value)}
                        className={`mt-1 input ${errors.baseTimeMin ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter base time in minutes"
                        disabled={submitting}
                      />
                      {errors.baseTimeMin && (
                        <p className="mt-1 text-sm text-red-600">{errors.baseTimeMin}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Estimated time for this route under normal conditions
                      </p>
                    </div>

                    {/* Calculated Speed Display */}
                    {formData.distanceKm && formData.baseTimeMin && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <label className="block text-sm font-medium text-gray-700">Calculated Average Speed</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {calculateSpeed(parseFloat(formData.distanceKm) || 0, parseInt(formData.baseTimeMin) || 1)} km/h
                        </p>
                      </div>
                    )}
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
                        modalMode === 'add' ? 'Add Route' : 'Update Route'
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

export default Routes;
