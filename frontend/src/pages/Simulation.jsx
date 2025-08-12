import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { simulationAPI, driversAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  PlayIcon,
  ChartBarIcon,
  ClockIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

function Simulation() {
  // State management
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDriverDetails, setShowDriverDetails] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors }, setValue, reset } = useForm({
    defaultValues: {
      selectedDriverIds: [],
      startTime: '09:00',
      maxHoursPerDay: 8
    }
  });

  const watchedDriverIds = watch('selectedDriverIds');

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
    fetchSimulationHistory();
  }, []);

  // Update selected drivers when form changes
  useEffect(() => {
    if (watchedDriverIds && drivers.length > 0) {
      const selected = drivers.filter(driver => 
        watchedDriverIds.includes(driver._id)
      );
      setSelectedDrivers(selected);
    }
  }, [watchedDriverIds, drivers]);

  // Fetch drivers function
  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll({ limit: 100, isActive: true });
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Fetch drivers error:', error);
      toast.error('Failed to fetch drivers');
    }
  };

  // Fetch simulation history
  const fetchSimulationHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await simulationAPI.getHistory({ limit: 10 });
      setSimulationHistory(response.data.simulations);
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Calculate driver fatigue for display
  const calculateDriverFatigue = (driver) => {
    const totalHours = driver.pastWeekHours.reduce((sum, hours) => sum + hours, 0);
    const avgHoursPerDay = totalHours / 7;
    return {
      average: avgHoursPerDay.toFixed(1),
      status: avgHoursPerDay > 8 ? 'High Fatigue' : avgHoursPerDay > 6 ? 'Medium Fatigue' : 'Low Fatigue',
      color: avgHoursPerDay > 8 ? 'text-red-600 bg-red-100' : avgHoursPerDay > 6 ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100'
    };
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (data.selectedDriverIds.length === 0) {
      toast.error('Please select at least one driver');
      return;
    }

    setLoading(true);
    try {
      const response = await simulationAPI.runSimulation({
        availableDrivers: data.selectedDriverIds.length,
        selectedDriverIds: data.selectedDriverIds,
        startTime: data.startTime,
        maxHoursPerDay: parseFloat(data.maxHoursPerDay)
      });

      setSimulationResult(response.data.results);
      toast.success('Simulation completed successfully!');
      
      // Refresh history
      fetchSimulationHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Simulation failed');
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quick select functions
  const selectAllDrivers = () => {
    const allDriverIds = drivers.map(driver => driver._id);
    setValue('selectedDriverIds', allDriverIds);
  };

  const clearAllDrivers = () => {
    setValue('selectedDriverIds', []);
  };

  const selectTopPerformers = () => {
    const topPerformers = drivers
      .filter(driver => calculateDriverFatigue(driver).average <= 7)
      .slice(0, 5)
      .map(driver => driver._id);
    setValue('selectedDriverIds', topPerformers);
  };

  // Reset form and results
  const resetSimulation = () => {
    reset();
    setSimulationResult(null);
    setSelectedDrivers([]);
  };

  // Load a previous simulation
  const loadSimulation = (simulation) => {
    setValue('startTime', simulation.inputs.startTime);
    setValue('maxHoursPerDay', simulation.inputs.maxHoursPerDay);
    if (simulation.inputs.selectedDriverIds) {
      setValue('selectedDriverIds', simulation.inputs.selectedDriverIds);
    }
    setSimulationResult(simulation.results);
    toast.success('Simulation loaded successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Simulation</h1>
          <p className="text-gray-600 mt-2">Run delivery simulations to optimize operations</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-secondary flex items-center"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            {showHistory ? 'Hide' : 'Show'} History
          </button>
          <button
            type="button"
            onClick={resetSimulation}
            className="btn btn-secondary flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Simulation Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Simulation Parameters</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Driver Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Drivers ({selectedDrivers.length} selected)
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={selectAllDrivers}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={selectTopPerformers}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Top Performers
                </button>
                <button
                  type="button"
                  onClick={clearAllDrivers}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowDriverDetails(!showDriverDetails)}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                >
                  {showDriverDetails ? 'Hide' : 'Show'} Details
                </button>
              </div>
            </div>

            <Controller
              name="selectedDriverIds"
              control={control}
              rules={{ required: 'Please select at least one driver' }}
              render={({ field }) => (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {drivers.map((driver) => {
                    const fatigue = calculateDriverFatigue(driver);
                    return (
                      <div
                        key={driver._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`driver-${driver._id}`}
                            checked={field.value.includes(driver._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, driver._id]);
                              } else {
                                field.onChange(field.value.filter(id => id !== driver._id));
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <label
                              htmlFor={`driver-${driver._id}`}
                              className="text-sm font-medium text-gray-900 cursor-pointer"
                            >
                              {driver.name}
                            </label>
                            {showDriverDetails && (
                              <div className="text-xs text-gray-500 mt-1">
                                <div>Shift: {driver.shiftHours}h | Avg Weekly: {fatigue.average}h</div>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${fatigue.color}`}>
                                    {fatigue.status}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {showDriverDetails && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Past Week Hours</div>
                            <div className="flex space-x-1 mt-1">
                              {driver.pastWeekHours.map((hours, index) => (
                                <span
                                  key={index}
                                  className="inline-block w-6 h-6 text-xs bg-blue-100 text-blue-800 rounded text-center leading-6"
                                >
                                  {hours}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            />
            {errors.selectedDriverIds && (
              <p className="text-red-500 text-sm mt-1">{errors.selectedDriverIds.message}</p>
            )}
          </div>

          {/* Other Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Start Time
              </label>
              <input
                type="time"
                {...register('startTime', { required: 'Start time is required' })}
                className="input"
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Hours per Driver per Day
              </label>
              <input
                type="number"
                min="1"
                max="24"
                step="0.5"
                {...register('maxHoursPerDay', { 
                  required: 'Max hours is required',
                  min: { value: 1, message: 'Must be at least 1 hour' },
                  max: { value: 24, message: 'Must be at most 24 hours' }
                })}
                className="input"
                placeholder="e.g., 8"
              />
              {errors.maxHoursPerDay && (
                <p className="text-red-500 text-sm mt-1">{errors.maxHoursPerDay.message}</p>
              )}
            </div>
          </div>

          {/* Selected Drivers Summary */}
          {selectedDrivers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Drivers Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Total Drivers:</span>
                  <span className="ml-1 text-blue-900">{selectedDrivers.length}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Avg Shift Hours:</span>
                  <span className="ml-1 text-blue-900">
                    {(selectedDrivers.reduce((sum, d) => sum + d.shiftHours, 0) / selectedDrivers.length).toFixed(1)}h
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">High Fatigue:</span>
                  <span className="ml-1 text-blue-900">
                    {selectedDrivers.filter(d => calculateDriverFatigue(d).average > 8).length} drivers
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || selectedDrivers.length === 0}
            className="btn btn-primary px-8 py-3 text-lg flex items-center justify-center w-full sm:w-auto"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Running Simulation...
              </>
            ) : (
              <>
                <PlayIcon className="w-6 h-6 mr-2" />
                Run Simulation
              </>
            )}
          </button>
        </form>
      </div>

      {/* Simulation History */}
      {showHistory && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Simulation History</h3>
            <button
              onClick={fetchSimulationHistory}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowPathIcon className="w-4 h-4 inline mr-1" />
              Refresh
            </button>
          </div>
          
          {historyLoading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto"></div>
            </div>
          ) : simulationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No simulation history found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drivers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {simulationHistory.map((simulation) => (
                    <tr key={simulation._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(simulation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {simulation.inputs.availableDrivers}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ₹{simulation.results.totalProfit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          simulation.results.efficiencyScore >= 80 ? 'bg-green-100 text-green-800' :
                          simulation.results.efficiencyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {simulation.results.efficiencyScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <button
                          onClick={() => loadSimulation(simulation)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Load Simulation"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Simulation Results */}
      {simulationResult && (
        <div className="space-y-8">
          {/* Results Header */}
          <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Simulation Complete</h3>
                <p className="text-sm text-gray-600">
                  Processed {simulationResult.onTimeDeliveries + simulationResult.lateDeliveries} deliveries
                  with {selectedDrivers.length} drivers
                </p>
              </div>
            </div>
          </div>

          {/* KPI Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <CurrencyRupeeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Total Profit</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{simulationResult.totalProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Efficiency Score</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {simulationResult.efficiencyScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center">
                <div className="p-3 bg-emerald-500 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-700">On-time Deliveries</p>
                  <p className="text-2xl font-bold text-emerald-900">{simulationResult.onTimeDeliveries}</p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-500 rounded-lg">
                  <ExclamationCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-700">Late Deliveries</p>
                  <p className="text-2xl font-bold text-red-900">{simulationResult.lateDeliveries}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance</h3>
              <div className="h-64">
                <Pie 
                  data={{
                    labels: ['On-time', 'Late'],
                    datasets: [{
                      data: [simulationResult.onTimeDeliveries, simulationResult.lateDeliveries],
                      backgroundColor: ['#10B981', '#EF4444'],
                      borderWidth: 2,
                      borderColor: '#ffffff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Cost Breakdown</h3>
              <div className="h-64">
                <Bar 
                  data={{
                    labels: ['Base Cost', 'Traffic Surcharge', 'Total Cost'],
                    datasets: [{
                      label: 'Amount (₹)',
                      data: [
                        simulationResult.fuelCostBreakdown.baseCost,
                        simulationResult.fuelCostBreakdown.trafficSurcharge,
                        simulationResult.fuelCostBreakdown.totalCost
                      ],
                      backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `₹${context.parsed.y.toLocaleString()}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₹' + value.toLocaleString();
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Penalty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bonus
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {simulationResult.deliveryStats?.map((delivery) => (
                    <tr key={delivery.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{delivery.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          delivery.isOnTime 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {delivery.isOnTime ? 'On-time' : 'Late'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{delivery.profit?.toFixed(2) || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.penalty > 0 ? `₹${delivery.penalty}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.bonus > 0 ? `₹${delivery.bonus?.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {simulationResult.deliveryStats?.length || 0}
                </div>
                <div className="text-gray-600">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ₹{(simulationResult.totalProfit / (simulationResult.deliveryStats?.length || 1)).toFixed(0)}
                </div>
                <div className="text-gray-600">Avg Profit/Order</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{simulationResult.fuelCostBreakdown.totalCost.toLocaleString()}
                </div>
                <div className="text-gray-600">Total Fuel Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedDrivers.length}
                </div>
                <div className="text-gray-600">Drivers Used</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulation;
