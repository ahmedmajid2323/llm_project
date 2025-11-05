package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gocolly/colly"
	"github.com/gorilla/handlers"
)

var visitedurls = make(map[string]bool)
var mu sync.Mutex // Mutex to protect concurrent access to visitedurls

func main() {
	http.HandleFunc("/visited-urls", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			// Parse the JSON body
			var requestBody struct {
				URL string `json:"url"`
			}
			err := json.NewDecoder(r.Body).Decode(&requestBody)
			if err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			mu.Lock()
			visitedurls = make(map[string]bool)
			mu.Unlock()

			// Start crawling the provided URL and wait for it to finish
			crawl(requestBody.URL)

			// Prepare the payload to send to the Node.js server
			payload := map[string]interface{}{
				"visitedurls": visitedurls,
			}

			// Convert the payload to JSON
			jsonData, err := json.Marshal(payload)
			if err != nil {
				fmt.Println("Error encoding JSON:", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			// Send the POST request to the Node.js server
			resp, err := http.Post("http://localhost:3000/load_web_crawling", "application/json", bytes.NewBuffer(jsonData))
			if err != nil {
				fmt.Println("Error sending POST request:", err)
				http.Error(w, "Failed to send data to Node.js server", http.StatusInternalServerError)
				return
			}
			defer resp.Body.Close()

			// Print the response from the Node.js server
			fmt.Println("Response status:", resp.Status)

			if resp.StatusCode == http.StatusOK {
				// Respond with a success message
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"message": "Crawling completed with langchain js",
					"urls":    visitedurls,
				})
			} else {
				// Handle non-200 responses from the Node.js server
				http.Error(w, "Node.js server returned an error", resp.StatusCode)
			}

		}
	})

	// Enable CORS for the server
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}), // Allow all origins
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)

	// Start the HTTP server with CORS enabled
	fmt.Println("Server started at http://localhost:8080")
	http.ListenAndServe(":8080", corsHandler(http.DefaultServeMux))
}

func crawl(currenturl string) {
	// Parse the URL to extract the domain
	parsedURL, err := url.Parse(currenturl)
	if err != nil {
		fmt.Println("Error parsing URL:", err)
		return
	}
	domain := parsedURL.Hostname()
	fmt.Println("Allowed Domain:", domain)

	// Instantiate a new collector
	c := colly.NewCollector(
		colly.AllowedDomains(domain),
		colly.MaxDepth(1),
		colly.Async(true), // Enable asynchronous crawling
	)

	// Set a limit for concurrent requests
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Parallelism: 5,               // Number of concurrent requests
		Delay:       2 * time.Second, // 2 seconds delay between requests
	})

	// Find and visit all links
	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		// Get the absolute URL
		link := e.Request.AbsoluteURL(e.Attr("href"))
		if link != "" {
			// Use a mutex to safely access the visitedurls map
			mu.Lock()
			if !visitedurls[link] {
				visitedurls[link] = true
				mu.Unlock()
				// Visit the link
				e.Request.Visit(link)
			} else {
				mu.Unlock()
			}
		}
	})

	// Add an OnRequest callback to track progress
	c.OnRequest(func(r *colly.Request) {
		fmt.Println("Crawling:", r.URL)
	})

	// Handle request errors
	c.OnError(func(e *colly.Response, err error) {
		fmt.Println("Request URL:", e.Request.URL, "failed with response:", e, "\nError:", err)
	})

	// Start the crawl
	err = c.Visit(currenturl)
	if err != nil {
		fmt.Println("Error visiting page:", err)
	}

	// Wait for the crawler to finish (required for async mode)
	c.Wait()
}
