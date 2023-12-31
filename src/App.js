import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Papa from "papaparse";
import { DataGrid } from "@mui/x-data-grid";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("No file chosen");
  const [fileType, setFileType] = useState("csv");
  const [encoding, setEncoding] = useState("UTF-8");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [fieldsToDisplay, setFieldsToDisplay] = useState([]);
  const [selectedAvailableFields, setSelectedAvailableFields] = useState([]);
  const [selectedDisplayFields, setSelectedDisplayFields] = useState([]);
  const [selectedAvField, setSelectedAvField] = useState(null);
  const [selectedDisField, setSelectedDisField] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const fileInput = useRef();
  const [parsedArray, setParsedArray] = useState([]);
  const [typefile, setTypefile] = useState("json");
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const selectedFileType = selectedFile.name.split(".").pop();

      setTypefile(selectedFileType);
      if (selectedFileType === "csv" || selectedFileType === "json") {
        setMessage(`${selectedFile.name} uploaded`);
      } else {
        setMessage(`${selectedFile.name} not supported`);
      }
      readFile(selectedFile);
    } else {
      setMessage("No file chosen");
    }
  };

  function extractKeysFromObject(obj, path = "") {
    return Object.keys(obj).reduce((keys, key) => {
      if (key === "count") return keys;
      let newPath = path ? `${path}.${key}` : key;
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        if (!Number.isInteger(parseInt(key))) {
          return [...keys, ...extractKeysFromObject(obj[key], newPath)];
        } else {
          obj[key]["ProductID"] = key;
          return [...keys, ...extractKeysFromObject(obj[key])];
        }
      } else {
        return [...keys, newPath];
      }
    }, []);
  }

  const handleAddFields = () => {
    setFieldsToDisplay([...fieldsToDisplay, ...selectedAvailableFields]);
    setSelectedAvailableFields([]);
  };

  const handleRemoveFields = () => {
    setFieldsToDisplay(
      fieldsToDisplay.filter((field) => !selectedDisplayFields.includes(field))
    );
    setSelectedDisplayFields([]);
  };

  const handleSelectAvailableField = (field) => {
    setSelectedAvField(field);
    setSelectedAvailableFields([...selectedAvailableFields, field]);
  };

  const handleSelectDisplayField = (field) => {
    setSelectedDisField(field);
    setSelectedDisplayFields([...selectedDisplayFields, field]);
  };

  const createColumns = (fields) => {
    return fields.map((field) => ({
      field: field,
      headerName: field.charAt(0).toUpperCase() + field.slice(1),
      width: 150,
      type: "string",
    }));
  };

  const columns = createColumns(fieldsToDisplay);
  let parsedDataArray = [];

  const readFile = (file) => {
    const fileType = file.name.split(".").pop();
    if (fileType === "csv") {
      Papa.parse(file, {
        delimiter: delimiter,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const headers = Object.keys(results.data[0]);
            setAvailableFields(headers);
            setParsedData(results.data);
          } else {
            setAvailableFields([]);
            setParsedData([]);
          }
        },

        header: true,
      });
    } else if (fileType === "json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target.result;
        const data = JSON.parse(fileContent);
        let availableFields = extractKeysFromObject(data);

        availableFields = availableFields.filter(
          (field, index, self) => self.indexOf(field) === index
        );
        setAvailableFields(availableFields);
        setParsedData(data);
      };
      reader.readAsText(file);
    }
  };

  console.log("Type_of_file:", typefile);
  if (typefile === "csv") {
    parsedDataArray = parsedData.map((row, key) => {
      const newRow = { id: key };
      fieldsToDisplay.forEach((field) => {
        newRow[field] = row[field];
      });
      return newRow;
    });
  }

  if (parsedData && parsedData.products && typefile === "json") {
    if (parsedData.products) {
      parsedDataArray = Object.keys(parsedData.products).map((key) => {
        const product = parsedData.products[key];
        const row = { id: key };
        fieldsToDisplay.forEach((field) => {
          if (field === "ProductID") {
            row[field] = key;
          } else {
            row[field] = product[field];
          }
        });
        return row;
      });
    } else {
      console.error("parsedData.products is null");
    }
  }

  let sortedDataArray = parsedDataArray;

  if (parsedDataArray.length > 0 && "popularity" in parsedDataArray[0]) {
    sortedDataArray = parsedDataArray.sort(
      (a, b) => b.popularity - a.popularity
    );
  }

  return (
    <div className="container">
      <div className="boxone">
        <input
          id="file-upload"
          type="file"
          accept=".csv,.json"
          style={{ display: "none" }}
          onChange={handleFileChange}
          ref={fileInput}
        />
        <button onClick={() => fileInput.current.click()}>Choose File</button>

        <p>Supported File Type(s): .CSV, .JSON</p>
        <p>{message}</p>
      </div>

      <div className="boxtwo">
        <div className="setting">
          <label>File Type: </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div className="setting">
          <label>Character Encoding: </label>
          <select
            value={encoding}
            onChange={(e) => setEncoding(e.target.value)}
          >
            <option value="UTF-8">UTF-8</option>
            <option value="ASCII">ASCII</option>
          </select>
        </div>

        {fileType === "csv" && (
          <>
            <div className="setting">
              <label>Delimiter: </label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
              >
                <option value=",">Comma (,)</option>
                <option value=" ">Space</option>
                <option value="\t">Tab</option>
                <option value=";">Semicolon (;)</option>
              </select>
            </div>

            <div className="setting">
              <label>
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                />
                Has Header
              </label>
            </div>
          </>
        )}
      </div>

      <div className="boxthree">
        <p>Select the fields to be displayed</p>
        <p>Available Fields:</p>
        <div className="smallbox">
          {availableFields.map((field, index) => (
            <div
              key={index}
              onClick={() => handleSelectAvailableField(field)}
              className={`field-item ${
                field === selectedAvField ? "selected" : ""
              }`}
            >
              {field}
            </div>
          ))}
        </div>

        <button onClick={handleAddFields} style={{ marginLeft: "10px" }}>
          &gt;&gt;
        </button>
        <button onClick={handleRemoveFields}>&lt;&lt;</button>

        <p>Fields to Display:</p>
        <div className="smallbox">
          {fieldsToDisplay.map((field, index) => (
            <div
              key={index}
              onClick={() => handleSelectDisplayField(field)}
              className={`field-item ${
                field === selectedDisField ? "selected" : ""
              }`}
            >
              {field}
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowGrid(true)}
          style={{ marginLeft: "10px" }}
        >
          Display
        </button>
      </div>

      {showGrid && (
        <div className="lastbox">
          <DataGrid rows={sortedDataArray} columns={columns} pageSize={10} />
        </div>
      )}
    </div>
  );
}
