import LogModal from "./LogModal";
import LogForm from "./LogForm";
import { API_BASE_URL } from "../utils/api";
import { useEffect, useState } from "react";
import { LOG_PATH, FOOD_PATH, AUTH_PATH } from "../utils/paths";
import { TYPES } from "../utils/groceryConstants";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function LogList({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [logToUpdate, setLogToUpdate] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    // Wait until we have currentUser to fetch logs
    if (currentUser) {
      fetch(`${API_BASE_URL}${LOG_PATH}/${currentUser}`)
        .then((response) => response.json())
        .then((data) => {
          setLogs(data);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }, [currentUser]);

  useEffect(() => {
    fetch(`${API_BASE_URL}${FOOD_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setFoodItems(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  // Filter logs when date changes
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      const filtered = logs.filter((log) => log.date_logged === dateString);
      setFilteredLogs(filtered);
    } else {
      // All logs if no date selected
      setFilteredLogs(logs);
    }
  }, [selectedDate, logs]);

  const getFoodNameById = (itemId) => {
    const foodItem = foodItems.find((item) => item.id === itemId);
    return foodItem ? foodItem.name : "Unknown id";
  };

  const handleLogAdded = (createdLog) => {
    setLogs((prevLogs) => [createdLog.log, ...prevLogs]);
    setActiveModal(null);
  };

  const handleLogUpdated = (updatedLog) => {
    setLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === updatedLog.log.id ? updatedLog.log : log
      )
    );
    setActiveModal(null);
    setLogToUpdate(null);
  };

  const handleDelete = async (logToDelete) => {
    try {
      await fetch(`${API_BASE_URL}${LOG_PATH}/${logToDelete.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 200) {
            setLogs(
              logs.filter(function (log) {
                return log !== logToDelete;
              })
            );
          }
        })
        .catch((err) => {
          console.log("Failed to delete log:", err);
        });
    } catch (err) {
      console.log("Failed to delete log:", err.message);
    }
  };

  const openAddModal = () => {
    setActiveModal(TYPES.ADD);
    setLogToUpdate(null);
  };

  const openUpdateModal = (log) => {
    setActiveModal(`update-${log.id}`);
    setLogToUpdate(log);
  };

  const closeModal = () => {
    setActiveModal(null);
    setLogToUpdate(null);
  };

  const formatDateString = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  return (
    <div>
      <h1 className="mb-2 mt-2">Food Logs</h1>
      <p className="text-gray-600">
        {filteredLogs.length} of {logs.length} total entries{" "}
        {selectedDate && `for ${selectedDate.toLocaleDateString()}`}
      </p>
      <div className="mt-2 mb-2">
        <div>
          <button className="mb-2" onClick={openAddModal}>
            Add New Log
          </button>
        </div>
        <label className="text-md font-medium mb-2 mr-2">Filter by date:</label>

        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          dateFormat="MMMM d, yyyy"
          placeholderText="Select a date"
          maxDate={new Date()}
        />
        {selectedDate && (
          <button
            onClick={clearDateFilter}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2"
          >
            Clear Filter
          </button>
        )}
      </div>
      {activeModal === TYPES.ADD && (
        <LogModal onClose={closeModal}>
          <LogForm
            handleLogAdded={handleLogAdded}
            handleLogUpdated={handleLogUpdated}
            setShowModal={closeModal}
            type={TYPES.ADD}
            logToUpdate={null}
            currentUser={currentUser}
          />
        </LogModal>
      )}
      <div className="logList">
        {logs.length === 0 && <p>No logs yet!</p>}
        {/* Sorted by most recently added  */}
        {filteredLogs
          .sort((a, b) => b.id - a.id)
          .map((log) => (
            <div className="logCard" key={log.id}>
              <h3 className="log-title">
                Log for {formatDateString(log.date_logged)}
              </h3>
              <p className="log-item">
                Food item: {getFoodNameById(log.item_id)}
              </p>
              <p className="log-servings">Servings: {log.servings}</p>
              <button
                className="!bg-sky-100 mr-1"
                id="editBtn"
                onClick={() => openUpdateModal(log)}
              >
                Update
              </button>
              <button
                className="!bg-zinc-100 ml-1"
                id="deleteBtn"
                onClick={() => handleDelete(log)}
              >
                Delete
              </button>
              {activeModal === `update-${log.id}` && (
                <LogModal onClose={closeModal}>
                  <LogForm
                    handleLogAdded={handleLogAdded}
                    handleLogUpdated={handleLogUpdated}
                    setShowModal={closeModal}
                    type={TYPES.UPDATE}
                    logToUpdate={log}
                    currentUser={currentUser}
                  />
                </LogModal>
              )}
            </div>
          ))}
        {filteredLogs.length === 0 && (
          <p className="mt-6">No logs on this day!</p>
        )}
      </div>
    </div>
  );
}
