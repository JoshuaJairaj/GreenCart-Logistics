import React, { useState, useEffect } from 'react';
import { driversAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Drivers = () => {
  // State management
  const [drivers, setDrivers] = useState([]);
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
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shiftHours: '',
    pastWeekHours: Array(7).fill('')
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Day names for display
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Fetch drivers on component mount and pagination changes
  useEffect(() => {
    fetchDrivers();
  }, [pagination.currentPage]);

  // Fetch drivers function
  const fetchDrivers = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      const response = await driversAPI.getAll({ 
        page: page, 
        limit: 10,
        isActive: true 
      });
      
      setDrivers(response.data.drivers);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Fetch drivers error:', error);
      toast.error('Failed to fetch drivers');
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
  const openModal = (mode, driver = null) => {
    setModalMode(mode);
    setSelectedDriver(driver);
    setErrors({});

    if (mode === 'add') {
      setFormData({
        name: '',
        shiftHours: '',
        pastWeekHours: Array(7).fill('')
      });
    } else if (driver && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: driver.name,
        shiftHours: driver.shiftHours.toString(),
        pastWeekHours: driver.pastWeekHours.map(h => h.toString())
      });
    }
    
    setShowModal(true);
  };

  // Close modal function
  const closeModal = () => {
    setShowModal(false);
    setSelectedDriver(null);
    setFormData({
      name: '',
      shiftHours: '',
      pastWeekHours: Array(7).fill('')
    });
    setErrors({});
    setSubmitting(false);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Shift hours validation
    const shiftHours = parseFloat(formData.shiftHours);
    if (!formData.shiftHours || formData.shiftHours === '') {
      newErrors.shiftHours = 'Shift hours is required';
    } else if (isNaN(shiftHours)) {
      newErrors.shiftHours = 'Must be a valid number';
    } else if (shiftHours < 0 || shiftHours > 24) {
      newErrors.shiftHours = 'Must be between 0 and 24';
    }

    // Past week hours validation
    formData.pastWeekHours.forEach((hours, index) => {
      if (!hours || hours === '') {
        newErrors[`day${index}`] = 'Required';
      } else {
        const dayHours = parseFloat(hours);
        if (isNaN(dayHours)) {
          newErrors[`day${index}`] = 'Invalid';
        } else if (dayHours < 0 || dayHours > 24) {
          newErrors[`day${index}`] = '0-24h';
        }
      }
    });

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
      const driverData = {
        name: formData.name.trim(),
        shiftHours: parseFloat(formData.shiftHours),
        pastWeekHours: formData.pastWeekHours.map(h => parseFloat(h))
      };

      if (modalMode === 'add') {
        await driversAPI.create(driverData);
        toast.success('Driver created successfully!');
        fetchDrivers(1); // Reset to first page
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      } else if (modalMode === 'edit') {
        await driversAPI.update(selectedDriver._id, driverData);
        toast.success('Driver updated successfully!');
        fetchDrivers();
      }

      closeModal();
    } catch (error) {
      console.error('Driver operation error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details?.[0]?.msg || 
                          'Operation failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete driver
  const handleDelete = async (driver) => {
    const confirmMessage = `Are you sure you want to delete driver "${driver.name}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await driversAPI.delete(driver._id);
        toast.success('Driver deleted successfully!');
        
        // If we're on the last item of the last page, go to previous page
        const remainingItems = pagination.total - 1;
        const maxPage = Math.ceil(remainingItems / 10);
        const targetPage = pagination.currentPage > maxPage ? Math.max(1, maxPage) : pagination.currentPage;
        
        if (targetPage !== pagination.currentPage) {
          setPagination(prev => ({ ...prev, currentPage: targetPage }));
        } else {
          fetchDrivers();
        }
      } catch (error) {
        console.error('Delete driver error:', error);
        toast.error('Failed to delete driver');
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

  // Handle day hours change
  const handleDayHoursChange = (dayIndex, value) => {
    const newPastWeekHours = [...formData.pastWeekHours];
    newPastWeekHours[dayIndex] = value;
    setFormData(prev => ({
      ...prev,
      pastWeekHours: newPastWeekHours
    }));
    
    // Clear error for this day
    if (errors[`day${dayIndex}`]) {
      setErrors(prev => ({
        ...prev,
        [`day${dayIndex}`]: ''
      }));
    }
  };

  // Calculate average hours
  const calculateAverageHours = (pastWeekHours) => {
    const total = pastWeekHours.reduce((sum, hours) => sum + hours, 0);
    return (total / 7).toFixed(1);
  };

  // Get workload status
  const getWorkloadStatus = (avgHours) => {
    if (avgHours < 6) return { status: 'Light', color: 'text-green-600 bg-green-100' };
    if (avgHours < 8) return { status: 'Normal', color: 'text-blue-600 bg-blue-100' };
    if (avgHours < 10) return { status: 'Heavy', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'Overwork', color: 'text-red-600 bg-red-100' };
  };

  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <span className="ml-2 text-gray-600">Loading drivers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage your delivery drivers ({pagination.total} total)</p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="btn btn-primary flex items-center justify-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Driver
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search drivers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Drivers List */}
      <div className="card">
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No matching drivers found' : 'No drivers found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding a new driver.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button 
                  onClick={() => openModal('add')}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Driver
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
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Weekly Hours
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
                {filteredDrivers.map((driver) => {
                  const avgHours = calculateAverageHours(driver.pastWeekHours);
                  const workload = getWorkloadStatus(parseFloat(avgHours));
                  
                  return (
                    <tr key={driver._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {driver._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{driver.shiftHours}h</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {avgHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${workload.color}`}>
                          {workload.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal('view', driver)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', driver)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Edit Driver"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(driver)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Driver"
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
                    {modalMode === 'add' && 'Add New Driver'}
                    {modalMode === 'edit' && 'Edit Driver'}
                    {modalMode === 'view' && 'Driver Details'}
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
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDriver?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shift Hours</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDriver?.shiftHours} hours</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Past Week Hours</label>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {selectedDriver?.pastWeekHours.map((hours, index) => (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">{dayNames[index]}</div>
                            <div className="text-sm font-medium text-gray-900 bg-gray-50 rounded px-2 py-1">
                              {hours}h
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Average Weekly Hours</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {calculateAverageHours(selectedDriver?.pastWeekHours || [])} hours
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Workload Status</label>
                      <div className="mt-1">
                        {(() => {
                          const avgHours = calculateAverageHours(selectedDriver?.pastWeekHours || []);
                          const workload = getWorkloadStatus(parseFloat(avgHours));
                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${workload.color}`}>
                              {workload.status}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`mt-1 input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter driver name"
                        disabled={submitting}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    {/* Shift Hours Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Shift Hours <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={formData.shiftHours}
                        onChange={(e) => handleInputChange('shiftHours', e.target.value)}
                        className={`mt-1 input ${errors.shiftHours ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter shift hours (0-24)"
                        disabled={submitting}
                      />
                      {errors.shiftHours && (
                        <p className="mt-1 text-sm text-red-600">{errors.shiftHours}</p>
                      )}
                    </div>

                    {/* Past Week Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Past Week Hours <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {formData.pastWeekHours.map((hours, index) => (
                          <div key={index}>
                            <label className="block text-xs text-gray-500 text-center mb-1">
                              {dayNames[index]}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={hours}
                              onChange={(e) => handleDayHoursChange(index, e.target.value)}
                              className={`input text-sm text-center ${
                                errors[`day${index}`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                              }`}
                              placeholder="0"
                              disabled={submitting}
                            />
                            {errors[`day${index}`] && (
                              <p className="text-xs text-red-600 text-center mt-1">
                                {errors[`day${index}`]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter hours worked for each day of the past week
                      </p>
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
                        modalMode === 'add' ? 'Add Driver' : 'Update Driver'
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

export default Drivers;
