package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net/mail"
	"net/textproto"
	"strings"
)

const maxRenderedBodyBytes = 500000

type attachment struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Size        int    `json:"size"`
}

type parsedEmail struct {
	FromName    string
	BodyText    string
	BodyHTML    string
	Attachments []attachment
}

func parseRawEmail(raw []byte) (parsedEmail, error) {
	message, err := mail.ReadMessage(bytes.NewReader(raw))
	if err != nil {
		return parsedEmail{}, err
	}
	result := parsedEmail{}
	if from, err := mail.ParseAddress(message.Header.Get("From")); err == nil {
		result.FromName = decodeHeader(from.Name)
	}
	if err := parseMIMEPart(textproto.MIMEHeader(message.Header), message.Body, &result); err != nil {
		return parsedEmail{}, err
	}
	result.BodyText = truncateBody(result.BodyText)
	result.BodyHTML = truncateBody(result.BodyHTML)
	return result, nil
}

func parseMIMEPart(header textproto.MIMEHeader, body io.Reader, result *parsedEmail) error {
	mediaType, params, err := mime.ParseMediaType(header.Get("Content-Type"))
	if err != nil || mediaType == "" {
		mediaType = "text/plain"
	}
	mediaType = strings.ToLower(mediaType)
	if strings.HasPrefix(mediaType, "multipart/") {
		boundary := params["boundary"]
		if boundary == "" {
			return fmt.Errorf("multipart message has no boundary")
		}
		reader := multipart.NewReader(body, boundary)
		for {
			part, err := reader.NextPart()
			if err == io.EOF {
				return nil
			}
			if err != nil {
				return err
			}
			if err := parseMIMEPart(part.Header, part, result); err != nil {
				_ = part.Close()
				return err
			}
			_ = part.Close()
		}
	}

	decoded := decodedReader(body, header.Get("Content-Transfer-Encoding"))
	content, err := io.ReadAll(io.LimitReader(decoded, maxRenderedBodyBytes+1))
	if err != nil {
		return err
	}
	disposition, dispositionParams, _ := mime.ParseMediaType(header.Get("Content-Disposition"))
	filename := decodeHeader(dispositionParams["filename"])
	if filename == "" {
		filename = decodeHeader(params["name"])
	}
	if strings.EqualFold(disposition, "attachment") || filename != "" {
		result.Attachments = append(result.Attachments, attachment{Filename: filename, ContentType: mediaType, Size: len(content)})
		return nil
	}

	switch mediaType {
	case "text/plain":
		if result.BodyText != "" {
			result.BodyText += "\n\n"
		}
		result.BodyText += string(content)
	case "text/html":
		if result.BodyHTML != "" {
			result.BodyHTML += "\n"
		}
		result.BodyHTML += string(content)
	}
	return nil
}

func decodedReader(reader io.Reader, transferEncoding string) io.Reader {
	switch strings.ToLower(strings.TrimSpace(transferEncoding)) {
	case "base64":
		return base64.NewDecoder(base64.StdEncoding, reader)
	case "quoted-printable":
		return quotedprintable.NewReader(reader)
	default:
		return reader
	}
}

func decodeHeader(value string) string {
	decoded, err := new(mime.WordDecoder).DecodeHeader(strings.TrimSpace(value))
	if err != nil {
		return strings.TrimSpace(value)
	}
	return decoded
}

func truncateBody(value string) string {
	if len(value) <= maxRenderedBodyBytes {
		return value
	}
	return value[:maxRenderedBodyBytes]
}
