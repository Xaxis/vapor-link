define([
  'underscore'
], function( _ ) {
  var File = {};

  /**
   * Returns file object from drag/drop or file input change events.
   * @param e
   * @returns {*}
   */
  File.getFiles = function( e ) {
    e.stopPropagation();
    var
      oe      = e.originalEvent,
      type    = e.type,
      files   = type == 'change' ? oe.target.files : oe.dataTransfer.files;
    return files;
  };

  /**
   * Returns a formatted string from a file's date object.
   * @param file
   * @returns {string}
   */
  File.printDate = function( file ) {
    var
      m           = file.lastModifiedDate,
      dateString  =
        m.getUTCFullYear() +"/"+
        ("0" + (m.getUTCMonth()+1)).slice(-2) +"/"+
        ("0" + m.getUTCDate()).slice(-2) + " " +
        ("0" + m.getUTCHours()).slice(-2) + ":" +
        ("0" + m.getUTCMinutes()).slice(-2) + ":" +
        ("0" + m.getUTCSeconds()).slice(-2);
    return dateString;
  };

  /**
   * Returns a file size formatted string.
   * @param file
   * @returns {string}
   */
  File.printFileSize = function( file ) {
    var
      sizes   = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
      bytes   = (typeof file == 'string' || typeof file == 'number') ? file : file.size,
      i       = parseFloat(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (bytes == 0) {
      return '0 Bytes';
    } else {
      return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
  };

  /**
   * Returns the total number of chunks of a file based on a specified chunk size.
   * @param file
   * @param chunk_size
   * @returns {number}
   */
  File.getChunkCount = function( file, chunk_size ) {
    var
      file_size     = file.size - 1,
      chunk_count   = Math.ceil(file_size / chunk_size);
    return chunk_count;
  };

  /**
   * Iterate over each chunk of a file
   * @param file
   * @param chunk_size
   * @param callback
   */
  File.forEachChunk = function( file, chunk_size, callback ) {
    var
      file_size     = file.size - 1,
      chunk_count   = Math.ceil(file_size / chunk_size),
      chunk_index   = 0,
      reader        = new FileReader();
    file.chunk_total = chunk_count;
    reader.onloadend = function(e) {
      if (e.target.readyState == FileReader.DONE) {
        var file_data = reader.result;
        for (chunk_index; chunk_index < chunk_count; chunk_index++) {
          var start = chunk_index * chunk_size;
          var end = start + chunk_size;
          var chunk = file_data.slice(start, end);
          callback.call(file, chunk_index, chunk);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return File;
});
