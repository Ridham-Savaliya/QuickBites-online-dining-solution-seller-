import React, { useState, useContext, useEffect } from 'react';
import { FaTrash, FaPlus, FaCopy, FaWhatsapp, FaEnvelope, FaTelegram, FaSms, FaTimes, FaShare } from 'react-icons/fa';
import { SellerContext } from '../Context/SellerContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import {jwtDecode} from "jwt-decode";

const AddDeliveryAgent = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAgents, setFetchingAgents] = useState(false);
  const { stoken, backend } = useContext(SellerContext);

  const [showModal, setShowModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [agentInfo, setAgentInfo] = useState({});
  const [editDriver, setEditDriver] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  
  const token = localStorage.getItem("seller-token");
  const decoded = jwtDecode(token);
  const sellerId = decoded.id;

  const onSubmitHandler = async () => {
    setLoading(true);
    try {
      const agentData = { firstName, lastName, contactNo, email, gender, sellerId };

      const { data } = await axios.post(
        `${backend}/api/delivery-agent/invite-agent`,
        agentData,
        { headers: { Authorization: `Bearer ${stoken}` } }
      );

      if (data.success) {
        toast.success("Agent added successfully!");
        
        // Store code and agent info for modal
        setSecretCode(data.secretCode);
        setAgentInfo({ firstName, lastName, email, contactNo });
        setShowCodeModal(true);

        getAgents();
        setShowModal(false);
        resetForm();
      } else {
        toast.info(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secretCode);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = secretCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success("Code copied to clipboard!");
    }
  };

  const generateShareMessage = () => {
    return `🚀 Welcome to our Delivery Team!

Hi ${agentInfo.firstName} ${agentInfo.lastName},

You've been invited to join our delivery team as a delivery agent. Here are your registration details:

📋 Registration Code: ${secretCode}
👤 Name: ${agentInfo.firstName} ${agentInfo.lastName}
📧 Email: ${agentInfo.email}
📱 Contact: ${agentInfo.contactNo}

⚡ Steps to get started:
1. visit our Delivery Agent website.
2. Register using the code above
3. Complete your profile setup
4. Start earning with deliveries!

💰 Earn ₹40 per successful delivery
🏆 Flexible working hours
📊 Track your earnings in real-time

This code expires in 1 hour, so please register soon!

Welcome aboard! 🎉

Best regards,
Your Restaurant Team`;
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(generateShareMessage());
    const phoneNumber = agentInfo.contactNo.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('🚀 Delivery Agent Registration - Welcome to Our Team!');
    const body = encodeURIComponent(generateShareMessage());
    window.open(`mailto:${agentInfo.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaTelegram = () => {
    const message = encodeURIComponent(generateShareMessage());
    window.open(`https://t.me/share/url?url=&text=${message}`, '_blank');
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(`Hi ${agentInfo.firstName}! Your delivery agent registration code: ${secretCode}. This code expires in 1 hour. Please register using our app. Welcome to the team!`);
    const phoneNumber = agentInfo.contactNo.replace(/[^0-9]/g, '');
    window.open(`sms:${phoneNumber}?body=${message}`, '_blank');
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🚀 Delivery Agent Registration',
          text: generateShareMessage(),
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Sharing failed');
        }
      }
    } else {
      toast.info('Web Share API not supported');
    }
  };

  const getAgents = async () => {
    setFetchingAgents(true);
    try {
      const { data } = await axios.post(
        `${backend}/api/delivery-agent/get-specific-agents`,
        { sellerId },
        { headers: { Authorization: `Bearer ${stoken}` } }
      );
      if (data.success) {
        setAgents(data.agentData);
        toast.success("Agents loaded successfully");
      } else {
        toast.info(data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setFetchingAgents(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setContactNo('');
    setEmail('');
    setGender('Male');
  };

  useEffect(() => {
    getAgents();
  }, []);

  const handleAdd = () => {
    setEditDriver(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this delivery agent?')) {
        const { data } = await axios.post(
          `${backend}/api/delivery-agent/delete-agents`,
          { id }
        );
        if (data.success) {
          getAgents();
          toast.success(data.message);
        } else {
          toast.info(data.message);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="text-3xl text-zinc-800 font-bold mb-8">Delivery Agent Management</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <button
          onClick={handleAdd}
          className="flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition duration-200 shadow-lg"
        >
          <FaPlus className="mr-2" /> Add New Agent
        </button>
      </div>

      {fetchingAgents ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="ml-4 text-gray-600">Loading agents...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-gray-100 text-zinc-800 text-sm font-semibold">
                  <th className="p-4 text-left">No</th>
                  <th className="p-4 text-left">First Name</th>
                  <th className="p-4 text-left">Last Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Contact No</th>
                  <th className="p-4 text-left">Gender</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents?.reverse().map((agent, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                    <td className="p-4 font-medium">{index + 1}</td>
                    <td className="p-4">{agent.firstName}</td>
                    <td className="p-4">{agent.lastName}</td>
                    <td className="p-4 text-blue-600">{agent.email}</td>
                    <td className="p-4">{agent.contactNo}</td>
                    <td className="p-4">{agent.gender}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.isRegistered 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agent.isRegistered ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(agent._id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition duration-150"
                        title="Delete Agent"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {agents?.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-gray-500">
                      <FaPlus className="mx-auto text-4xl mb-4 opacity-50" />
                      <p>No delivery agents added yet</p>
                      <p className="text-sm">Click "Add New Agent" to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">
                Add New Delivery Agent
              </h2>
              <p className="text-gray-600 mt-1">Fill in the agent's details to send an invitation</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  onChange={(e) => setFirstName(e.target.value)}
                  value={firstName}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  onChange={(e) => setLastName(e.target.value)}
                  value={lastName}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <input
                type="tel"
                placeholder="Contact Number"
                onChange={(e) => setContactNo(e.target.value)}
                value={contactNo}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              
              <input
                type="email"
                placeholder="Email Address"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              
              <div className="flex items-center gap-4">
                <label className="text-gray-700 font-medium">Gender:</label>
                <select 
                  onChange={(e) => setGender(e.target.value)} 
                  value={gender} 
                  className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={onSubmitHandler}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition duration-200 font-medium disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Agent"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Code Sharing Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 overflow-y-auto pt-[20%]  bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 relative">
              <button
                onClick={() => setShowCodeModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={20} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎉 Agent Invitation Created!
              </h2>
              <p className="text-gray-600">Share this registration code with your new delivery agent</p>
            </div>
            
            <div className="p-6">
              {/* Agent Info */}
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Agent Details:</h3>
                <p className="text-sm text-gray-700">
                  <strong>Name:</strong> {agentInfo.firstName} {agentInfo.lastName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {agentInfo.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Phone:</strong> {agentInfo.contactNo}
                </p>
              </div>

              {/* Secret Code Display */}
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-dashed border-orange-300 rounded-xl p-6 text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">Registration Code</p>
                <div className="text-3xl font-bold text-orange-600 tracking-wider mb-3 font-mono">
                  {secretCode}
                </div>
                <p className="text-xs text-gray-500">⚠️ This code expires in 1 hour</p>
              </div>

              {/* Copy Button */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-200 mb-6 font-medium"
              >
                <FaCopy /> Copy Code to Clipboard
              </button>

              {/* Sharing Options */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  Share with Agent
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition duration-200 font-medium"
                  >
                    <FaWhatsapp /> WhatsApp
                  </button>
                  
                  <button
                    onClick={shareViaEmail}
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
                  >
                    <FaEnvelope /> Email
                  </button>
                  
                  <button
                    onClick={shareViaSMS}
                    className="flex items-center justify-center gap-2 bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition duration-200 font-medium"
                  >
                    <FaSms /> SMS
                  </button>
                  
                  <button
                    onClick={shareViaTelegram}
                    className="flex items-center justify-center gap-2 bg-sky-500 text-white py-3 px-4 rounded-lg hover:bg-sky-600 transition duration-200 font-medium"
                  >
                    <FaTelegram /> Telegram
                  </button>
                </div>

                {/* Web Share API (if supported) */}
                {navigator.share && (
                  <button
                    onClick={shareViaWebShare}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition duration-200 font-medium"
                  >
                    <FaShare /> More Options
                  </button>
                )}
              </div>

              {/* Important Note */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📝 Next Steps:</strong> The agent should visit our website  and register using this code. Once registered, they'll appear as "Registered" in your agent list.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDeliveryAgent;
